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
import { extractWebhookData, validateWebhookData, formatAmount, calculateNetAmount } from '../shared/webhook-helpers';

export class AbacatePayWithdrawTrigger implements INodeType {
	description = createBaseTriggerDescription({
		displayName: 'AbacatePay Withdraw Trigger',
		name: 'abacatePayWithdrawTrigger',
		description: 'Escuta eventos relacionados a saques da AbacatePay',
		webhookPath: 'abacatepay-withdraw',
		defaultName: 'AbacatePay Withdraw Trigger',
		events: [
			{
				name: 'Withdraw Created',
				value: 'withdraw.created',
				description: 'Quando um novo saque é criado',
			},
			{
				name: 'Withdraw Completed',
				value: 'withdraw.completed',
				description: 'Quando um saque é completado',
			},
			{
				name: 'Withdraw Failed',
				value: 'withdraw.failed',
				description: 'Quando um saque falha',
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

		// Validate this is withdraw data
		if (!validateWebhookData(data, ['method', 'receiptUrl', 'kind']) && 
		    !validateWebhookData(data, ['amount', 'status', 'id'])) {
			return createNoWebhookResponse();
		}

		// Determine event type based on status
		let normalizedEvent = eventType;
		if (data.status === 'COMPLETE') {
			normalizedEvent = 'withdraw.completed';
		} else if (data.status === 'CANCELLED' || data.status === 'FAILED') {
			normalizedEvent = 'withdraw.failed';
		} else {
			normalizedEvent = 'withdraw.created';
		}

		// Filter by selected events
		if (!events.includes(normalizedEvent)) {
			return createNoWebhookResponse();
		}

		// Enrich withdraw data
		const enrichedData = {
			...data,
			event: normalizedEvent,
			resourceType: 'withdraw',
			timestamp: new Date().toISOString(),
			
			// Withdraw-specific enrichments
			withdraw: {
				status: {
					isCompleted: data.status === 'COMPLETE',
					isFailed: data.status === 'CANCELLED' || data.status === 'FAILED',
					isPending: data.status === 'PENDING',
				},
				amounts: data.amount ? {
					raw: data.amount,
					reais: formatAmount(data.amount as number),
					fee: data.platformFee || 0,
					feeReais: formatAmount((data.platformFee as number) || 0),
					net: calculateNetAmount(data.amount as number, (data.platformFee as number) || 0),
					netReais: formatAmount(calculateNetAmount(data.amount as number, (data.platformFee as number) || 0)),
				} : undefined,
				method: data.method,
				receiptUrl: data.receiptUrl,
				externalId: data.externalId,
			},
		};

		return createSuccessResponse(enrichedData);
	}
}
