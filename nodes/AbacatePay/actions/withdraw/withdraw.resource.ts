import { INodeProperties } from 'n8n-workflow';

export const withdrawResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'Withdraw',
			value: 'withdraw',
		},
	],
	default: 'withdraw',
};

export const withdrawOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['withdraw'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a withdraw',
			description: 'Cria um novo saque',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List all withdraws',
			description: 'Lista todos os saques',
		},
	],
	default: 'create',
};
