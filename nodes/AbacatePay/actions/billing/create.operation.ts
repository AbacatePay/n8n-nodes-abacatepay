import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'Products',
		name: 'products',
		type: 'fixedCollection',
		required: true,
		default: { product: [{}] },
		description: 'Lista de produtos que seu cliente está pagando',
		displayOptions: {
			show: {
				resource: ['billing'],
				operation: ['create'],
			},
		},
		typeOptions: {
			multipleValues: true,
		},
		options: [
			{
				name: 'product',
				displayName: 'Product',
				values: [
					{
						displayName: 'Description',
						name: 'description',
						type: 'string',
						required: true,
						default: '',
						description: 'Descrição do produto',
					},
					{
						displayName: 'External ID',
						name: 'externalId',
						type: 'string',
						required: true,
						default: '',
						description: 'ID único do produto',
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						required: true,
						default: '',
						description: 'Nome do produto',
					},
					{
						displayName: 'Price (In Cents)',
						name: 'price',
						type: 'number',
						required: true,
						default: 0,
						description: 'Preço em centavos (ex: 2000 = R$ 20,00)',
					},
					{
						displayName: 'Quantity',
						name: 'quantity',
						type: 'number',
						required: true,
						default: 1,
						description: 'Quantidade do produto',
					},
				],
			},
		],
	},
	{
		displayName: 'Return URL',
		name: 'returnUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'URL para redirecionar caso o cliente clique em "Voltar"',
		displayOptions: {
			show: {
				resource: ['billing'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Completion URL',
		name: 'completionUrl',
		type: 'string',
		required: true,
		default: '',
		description: 'URL para redirecionar quando o pagamento for concluído',
		displayOptions: {
			show: {
				resource: ['billing'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Frequency',
		name: 'frequency',
		type: 'options',
		required: true,
		default: 'ONE_TIME',
		description: 'Tipo de frequência da cobrança',
		displayOptions: {
			show: {
				resource: ['billing'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'One Time',
				value: 'ONE_TIME',
				description: 'Cobrança única',
			},
			{
				name: 'Multiple Payments',
				value: 'MULTIPLE_PAYMENTS',
				description: 'Pode ser paga múltiplas vezes',
			},
		],
	},
	{
		displayName: 'Methods',
		name: 'methods',
		type: 'multiOptions',
		required: true,
		default: ['PIX'],
		description: 'Métodos de pagamento disponíveis',
		displayOptions: {
			show: {
				resource: ['billing'],
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
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		default: {},
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['billing'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Customer ID',
				name: 'customerId',
				type: 'string',
				default: '',
				description: 'ID de um cliente já cadastrado',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'Identificador único da sua aplicação para a cobrança',
			},
			{
				displayName: 'Allow Coupons',
				name: 'allowCoupons',
				type: 'boolean',
				default: false,
				description: 'Whether cupons podem ser usados na cobrança',
			},
			{
				displayName: 'Coupons',
				name: 'coupons',
				type: 'string',
				default: '',
				description: 'Lista de cupons separados por vírgula (ex: ABKT10,ABKT5,PROMO10)',
			},
		],
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');

	// Get billing data
	const productsParam = this.getNodeParameter('products', i) as IDataObject;
	const products = (productsParam.product as IDataObject[]) || [];
	const returnUrl = this.getNodeParameter('returnUrl', i) as string;
	const completionUrl = this.getNodeParameter('completionUrl', i) as string;
	const frequency = this.getNodeParameter('frequency', i) as string;
	const methods = this.getNodeParameter('methods', i) as string[];
	const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

	const body: IDataObject = {
		products,
		returnUrl,
		completionUrl,
		frequency,
		methods,
	};

	// Add additional fields
	if (additionalFields.customerId) {
		body.customerId = additionalFields.customerId;
	}
	if (additionalFields.externalId) {
		body.externalId = additionalFields.externalId;
	}
	if (additionalFields.allowCoupons) {
		body.allowCoupons = additionalFields.allowCoupons;
	}
	if (additionalFields.coupons) {
		const couponsString = additionalFields.coupons as string;
		body.coupons = couponsString.split(',').map(c => c.trim());
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/billing/create`,
		body,
		json: true,
	};

	return await this.helpers.httpRequest(options);
}
