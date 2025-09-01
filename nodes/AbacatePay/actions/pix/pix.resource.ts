import { INodeProperties } from 'n8n-workflow';

export const pixResource: INodeProperties = {
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	noDataExpression: true,
	options: [
		{
			name: 'PIX QR Code',
			value: 'pix',
		},
	],
	default: 'pix',
};

export const pixOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['pix'],
		},
	},
	options: [
		{
			name: 'Check Status',
			value: 'checkStatus',
			action: 'Check pix qr code status',
			description: 'Verifica o status de um QR Code PIX',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create pix qr code',
			description: 'Cria um novo QR Code PIX',
		},
		{
			name: 'Simulate Payment',
			value: 'simulatePayment',
			action: 'Simulate PIX payment',
			description: 'Simula o pagamento de um QR Code PIX (modo desenvolvimento)',
		},
	],
	default: 'create',
};
