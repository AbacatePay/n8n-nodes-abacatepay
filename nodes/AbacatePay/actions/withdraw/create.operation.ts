import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		required: true,
		default: '',
		description: 'Identificador único do saque em seu sistema',
		displayOptions: {
			show: {
				resource: ['withdraw'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Amount (in Cents)',
		name: 'amount',
		type: 'number',
		required: true,
		default: 350,
		description: 'Valor do saque em centavos (mínimo: 350 = R$ 3,50)',
		typeOptions: {
			minValue: 350,
		},
		displayOptions: {
			show: {
				resource: ['withdraw'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Method',
		name: 'method',
		type: 'options',
		required: true,
		default: 'PIX',
		description: 'Método de saque',
		displayOptions: {
			show: {
				resource: ['withdraw'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'PIX',
				value: 'PIX',
			},
		],
	},
	{
		displayName: 'PIX Key',
		name: 'pixKey',
		type: 'string',
		required: true,
		default: '',
		description: 'Chave PIX para receber o saque',
		displayOptions: {
			show: {
				resource: ['withdraw'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'PIX Key Type',
		name: 'pixKeyType',
		type: 'options',
		required: true,
		default: 'CPF',
		description: 'Tipo da chave PIX',
		displayOptions: {
			show: {
				resource: ['withdraw'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'CNPJ',
				value: 'CNPJ',
			},
			{
				name: 'CPF',
				value: 'CPF',
			},
			{
				name: 'Email',
				value: 'EMAIL',
			},
			{
				name: 'Phone',
				value: 'PHONE',
			},
			{
				name: 'Random Key',
				value: 'RANDOM',
			},
		],
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		description: 'Descrição opcional do saque',
		displayOptions: {
			show: {
				resource: ['withdraw'],
				operation: ['create'],
			},
		},
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');

	// Get withdraw data
	const externalId = this.getNodeParameter('externalId', i) as string;
	const amount = this.getNodeParameter('amount', i) as number;
	const method = this.getNodeParameter('method', i) as string;
	const pixKey = this.getNodeParameter('pixKey', i) as string;
	const pixKeyType = this.getNodeParameter('pixKeyType', i) as string;
	const description = this.getNodeParameter('description', i, '') as string;

	// Validate required fields
	if (!externalId || externalId.trim() === '') {
		throw new Error('External ID is required');
	}
	if (!amount || amount < 350) {
		throw new Error('Amount must be at least 350 cents (R$ 3.50)');
	}
	if (!pixKey || pixKey.trim() === '') {
		throw new Error('PIX Key is required');
	}

	const body: IDataObject = {
		externalId: externalId.trim(),
		method,
		amount,
		pix: {
			key: pixKey.trim(),
			type: pixKeyType,
		},
	};

	// Add optional fields
	if (description && description.trim() !== '') {
		body.description = description.trim();
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/withdraw/create`,
		body,
		json: true,
	};

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: any) {
		if (error.response?.data) {
			throw new Error(`AbacatePay API Error: ${JSON.stringify(error.response.data)}`);
		}
		throw error;
	}
}
