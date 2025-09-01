import { INodeProperties } from 'n8n-workflow';

export const customerResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Customer',
			value: 'customer',
		},
	],
	default: 'customer',
};

export const customerOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['customer'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a customer',
			description: 'Cria um novo cliente',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List all customers',
			description: 'Lista todos os clientes',
		},
	],
	default: 'create',
};
