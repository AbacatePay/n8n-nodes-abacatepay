import {
	INodeType,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';

import { 
	createBaseTriggerDescription, 
	createNoWebhookResponse, 
	createSuccessResponse,
	authenticateWebhook,
} from '../shared/base-trigger';
import { extractWebhookData, validateWebhookData, formatAmount } from '../shared/webhook-helpers';

export class AbacatePayCouponTrigger implements INodeType {
	description = createBaseTriggerDescription({
		displayName: 'AbacatePay Coupon Trigger',
		name: 'abacatePayCouponTrigger',
		description: 'Escuta eventos relacionados a cupons da AbacatePay',
		webhookPath: 'abacatepay-coupon',
		defaultName: 'AbacatePay Coupon Trigger',
		events: [
			{
				name: 'Coupon Created',
				value: 'coupon.created',
				description: 'Quando um novo cupom é criado',
			},
			{
				name: 'Coupon Redeemed',
				value: 'coupon.redeemed',
				description: 'Quando um cupom é utilizado',
			},
			{
				name: 'Coupon Expired',
				value: 'coupon.expired',
				description: 'Quando um cupom expira',
			},
		],
	});

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		
		// Get parameters
		const events = this.getNodeParameter('events') as string[];
		const authType = this.getNodeParameter('authentication') as string;
		const username = this.getNodeParameter('username', '') as string;
		const password = this.getNodeParameter('password', '') as string;
		const headerName = this.getNodeParameter('headerName', '') as string;
		const headerValue = this.getNodeParameter('headerValue', '') as string;

		// Authenticate if required
		if (!authenticateWebhook(this, authType, username, password, headerName, headerValue)) {
			return createNoWebhookResponse();
		}

		// Extract webhook data
		const { data, eventType } = extractWebhookData(bodyData);

		// Validate this is coupon data
		if (!validateWebhookData(data, ['code', 'discountKind', 'discount'])) {
			return createNoWebhookResponse();
		}

		// Determine event type
		let normalizedEvent = eventType;
		if (data.status === 'EXPIRED') {
			normalizedEvent = 'coupon.expired';
		} else if (eventType.includes('redeem') || eventType.includes('used')) {
			normalizedEvent = 'coupon.redeemed';
		} else {
			normalizedEvent = 'coupon.created';
		}

		// Filter by selected events
		if (!events.includes(normalizedEvent)) {
			return createNoWebhookResponse();
		}

		// Enrich coupon data
		const enrichedData = {
			...data,
			event: normalizedEvent,
			resourceType: 'coupon',
			timestamp: new Date().toISOString(),
			
			// Coupon-specific enrichments
			coupon: {
				code: data.code,
				status: {
					isActive: data.status === 'ACTIVE',
					isExpired: data.status === 'EXPIRED',
					isInactive: data.status === 'INACTIVE',
				},
				discount: {
					type: data.discountKind,
					value: data.discount,
					isPercentage: data.discountKind === 'PERCENTAGE',
					isFixed: data.discountKind === 'FIXED',
					formatted: data.discountKind === 'PERCENTAGE' 
						? `${data.discount}%` 
						: `R$ ${formatAmount(data.discount as number)}`,
				},
				usage: {
					maxRedeems: data.maxRedeems,
					currentRedeems: data.redeemsCount || 0,
					remainingRedeems: data.maxRedeems === -1 
						? 'unlimited' 
						: Math.max(0, (data.maxRedeems as number) - ((data.redeemsCount as number) || 0)),
					isUnlimited: data.maxRedeems === -1,
				},
			},
		};

		return createSuccessResponse(enrichedData);
	}
}
