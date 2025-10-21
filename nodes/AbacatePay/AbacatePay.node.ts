import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import * as actions from './actions';

export class AbacatePay implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'AbacatePay',
		name: 'abacatePay',
		icon: 'file:abacate.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Integração com a API AbacatePay',
		defaults: {
			name: 'AbacatePay',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: ['main'] as NodeConnectionType[],
		credentials: [
			{
				name: 'abacatePayApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Billing',
						value: 'billing',
					},
					{
						name: 'Coupon',
						value: 'coupon',
					},
					{
						name: 'Customer',
						value: 'customer',
					},
					{
						name: 'PIX QR Code',
						value: 'pix',
					},
					{
						name: 'Withdraw',
						value: 'withdraw',
					},
				],
				default: 'customer',
			},
			// Customer operations
			actions.customer.customerOperations,
			...actions.customer.customerOperationExecute.create.description,
			...actions.customer.customerOperationExecute.list.description,
			// Billing operations
			actions.billing.billingOperations,
			...actions.billing.billingOperationExecute.create.description,
			...actions.billing.billingOperationExecute.list.description,
			// PIX operations
			actions.pix.pixOperations,
			...actions.pix.pixOperationExecute.create.description,
			...actions.pix.pixOperationExecute.simulatePayment.description,
			...actions.pix.pixOperationExecute.checkStatus.description,
			// Coupon operations
			actions.coupon.couponOperations,
			...actions.coupon.couponOperationExecute.create.description,
			...actions.coupon.couponOperationExecute.list.description,
			// Withdraw operations
			actions.withdraw.withdrawOperations,
			...actions.withdraw.withdrawOperationExecute.create.description,
			...actions.withdraw.withdrawOperationExecute.list.description,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const operation = this.getNodeParameter('operation', i) as string;

			let responseData: any;

			try {
				if (resource === 'customer') {
					if (operation === 'create') {
						responseData = await actions.customer.customerOperationExecute.create.execute.call(this, i);
					} else if (operation === 'list') {
						responseData = await actions.customer.customerOperationExecute.list.execute.call(this, i);
					}
				} else if (resource === 'billing') {
					if (operation === 'create') {
						responseData = await actions.billing.billingOperationExecute.create.execute.call(this, i);
					} else if (operation === 'list') {
						responseData = await actions.billing.billingOperationExecute.list.execute.call(this, i);
					}
				} else if (resource === 'pix') {
					if (operation === 'create') {
						responseData = await actions.pix.pixOperationExecute.create.execute.call(this, i);
					} else if (operation === 'simulatePayment') {
						responseData = await actions.pix.pixOperationExecute.simulatePayment.execute.call(this, i);
					} else if (operation === 'checkStatus') {
						responseData = await actions.pix.pixOperationExecute.checkStatus.execute.call(this, i);
					}
				} else if (resource === 'coupon') {
					if (operation === 'create') {
						responseData = await actions.coupon.couponOperationExecute.create.execute.call(this, i);
					} else if (operation === 'list') {
						responseData = await actions.coupon.couponOperationExecute.list.execute.call(this, i);
					}
				} else if (resource === 'withdraw') {
					if (operation === 'create') {
						responseData = await actions.withdraw.withdrawOperationExecute.create.execute.call(this, i);
					} else if (operation === 'list') {
						responseData = await actions.withdraw.withdrawOperationExecute.list.execute.call(this, i);
					}
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData.map(item => ({
						json: item,
						pairedItem: { item: i }
					})));
				} else {
					returnData.push({
						json: responseData,
						pairedItem: { item: i }
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {},
						error: error.message,
						pairedItem: { item: i }
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
