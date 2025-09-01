import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Amount (in Cents)',
		name: 'amount',
		type: 'number',
		required: true,
		default: 100,
		description: 'Valor da cobrança em centavos (ex: 2000 = R$ 20,00)',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		description: 'Mensagem que aparecerá na hora do pagamento do PIX (máx 140 caracteres)',
		typeOptions: {
			maxLength: 140,
		},
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Expires In (Seconds)',
		name: 'expiresIn',
		type: 'number',
		default: 3600,
		description: 'Tempo de expiração da cobrança em segundos',
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Customer',
		name: 'customer',
		type: 'collection',
		default: {},
		placeholder: 'Add Customer Info',
		description: 'Dados do cliente (opcional)',
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Nome completo do cliente',
			},
			{
				displayName: 'Cellphone',
				name: 'cellphone',
				type: 'string',
				default: '',
				description: 'Celular do cliente',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'E-mail do cliente',
				placeholder: 'name@email.com',
			},
			{
				displayName: 'Tax ID',
				name: 'taxId',
				type: 'string',
				default: '',
				description: 'CPF ou CNPJ do cliente',
			},
		],
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'collection',
		default: {},
		placeholder: 'Add Metadata',
		description: 'Metadados opcionais para a cobrança',
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'ID externo da sua aplicação',
			},
		],
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');
	
	// Get PIX data
	const amount = this.getNodeParameter('amount', i) as number;
	const description = this.getNodeParameter('description', i, '') as string;
	const expiresIn = this.getNodeParameter('expiresIn', i, 0) as number;
	const customer = this.getNodeParameter('customer', i, {}) as IDataObject;
	const metadata = this.getNodeParameter('metadata', i, {}) as IDataObject;

	// Validate required field
	if (!amount || amount <= 0) {
		throw new Error('Amount is required and must be greater than 0');
	}

	const body: IDataObject = {
		amount,
	};

	// Add optional fields only if they have meaningful values
	if (description && description.trim() !== '') {
		body.description = description.trim();
	}
	
	if (expiresIn && expiresIn > 0) {
		body.expiresIn = expiresIn;
	}
	
	// Only add customer if all required fields are present
	if (customer && Object.keys(customer).length > 0) {
		const { name, cellphone, email, taxId } = customer;
		if (name && cellphone && email && taxId) {
			body.customer = {
				name: name as string,
				cellphone: cellphone as string,
				email: email as string,
				taxId: taxId as string,
			};
		}
	}
	
	// Only add metadata if it has meaningful values
	if (metadata && Object.keys(metadata).length > 0) {
		const cleanMetadata: IDataObject = {};
		if (metadata.externalId && (metadata.externalId as string).trim() !== '') {
			cleanMetadata.externalId = (metadata.externalId as string).trim();
		}
		if (Object.keys(cleanMetadata).length > 0) {
			body.metadata = cleanMetadata;
		}
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/pixQrCode/create`,
		body,
		json: true,
	};

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: any) {
		// Enhanced error handling
		if (error.response?.data) {
			throw new Error(`AbacatePay API Error: ${JSON.stringify(error.response.data)}`);
		}
		throw error;
	}
}
