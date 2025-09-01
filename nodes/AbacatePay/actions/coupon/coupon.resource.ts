import { INodeProperties } from 'n8n-workflow';

export const couponResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Coupon',
			value: 'coupon',
		},
	],
	default: 'coupon',
};

export const couponOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['coupon'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a coupon',
			description: 'Cria um novo cupom de desconto',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List all coupons',
			description: 'Lista todos os cupons',
		},
	],
	default: 'create',
};
