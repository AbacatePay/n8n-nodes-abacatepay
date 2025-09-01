import { INodeProperties } from 'n8n-workflow';

export const billingResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Billing',
			value: 'billing',
		},
	],
	default: 'billing',
};

export const billingOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['billing'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a billing',
			description: 'Cria uma nova cobrança',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List all billings',
			description: 'Lista todas as cobranças',
		},
	],
	default: 'create',
};
