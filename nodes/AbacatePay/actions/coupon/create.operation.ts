import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Code',
		name: 'code',
		type: 'string',
		required: true,
		default: '',
		description: 'Código único do cupom (ex: DESCONTO20)',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Discount Kind',
		name: 'discountKind',
		type: 'options',
		required: true,
		default: 'PERCENTAGE',
		description: 'Tipo de desconto',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'Fixed Amount',
				value: 'FIXED',
				description: 'Valor fixo em centavos',
			},
			{
				name: 'Percentage',
				value: 'PERCENTAGE',
				description: 'Porcentagem de desconto',
			},
		],
	},
	{
		displayName: 'Discount Value',
		name: 'discount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Valor do desconto (% para PERCENTAGE ou centavos para FIXED)',
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Notes',
		name: 'notes',
		type: 'string',
		required: true,
		default: '',
		description: 'Descrição sobre o cupom',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Max Redeems',
		name: 'maxRedeems',
		type: 'number',
		default: -1,
		description: 'Quantidade máxima de usos (-1 para ilimitado)',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'collection',
		default: {},
		placeholder: 'Add Metadata',
		description: 'Metadados adicionais do cupom',
		displayOptions: {
			show: {
				resource: ['coupon'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'ID externo do cupom',
			},
		],
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');

	// Get coupon data
	const code = this.getNodeParameter('code', i) as string;
	const discountKind = this.getNodeParameter('discountKind', i) as string;
	const discount = this.getNodeParameter('discount', i) as number;
	const notes = this.getNodeParameter('notes', i, '') as string;
	const maxRedeems = this.getNodeParameter('maxRedeems', i, -1) as number;
	const metadata = this.getNodeParameter('metadata', i, {}) as IDataObject;

	// Validate required fields
	if (!code || code.trim() === '') {
		throw new Error('Code is required');
	}
	if (!notes || notes.trim() === '') {
		throw new Error('Notes is required');
	}
	if (!discount || discount <= 0) {
		throw new Error('Discount must be greater than 0');
	}

	const couponData: IDataObject = {
		code: code.trim().toUpperCase(),
		discountKind,
		discount,
		notes: notes.trim(),
	};

	if (maxRedeems !== undefined) {
		couponData.maxRedeems = maxRedeems;
	}

	// Only add metadata if it has meaningful values
	if (metadata && Object.keys(metadata).length > 0) {
		const cleanMetadata: IDataObject = {};
		if (metadata.externalId && (metadata.externalId as string).trim() !== '') {
			cleanMetadata.externalId = (metadata.externalId as string).trim();
		}
		if (Object.keys(cleanMetadata).length > 0) {
			couponData.metadata = cleanMetadata;
		}
	}

	const body: IDataObject = couponData;

	const options: IHttpRequestOptions = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/coupon/create`,
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
