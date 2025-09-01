import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'PIX QR Code ID',
		name: 'pixId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID do QR Code PIX para simular o pagamento',
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['simulatePayment'],
			},
		},
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'collection',
		default: {},
		placeholder: 'Add Metadata',
		description: 'Metadados opcionais para a requisição',
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['simulatePayment'],
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
	
	// Get simulation data
	const pixId = this.getNodeParameter('pixId', i) as string;
	const metadata = this.getNodeParameter('metadata', i) as IDataObject;

	const body: IDataObject = {};

	// Add metadata if provided
	if (metadata && Object.keys(metadata).length > 0) {
		body.metadata = metadata;
	}

	const options: IHttpRequestOptions = {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/pixQrCode/simulate-payment?id=${pixId}`,
		body,
		json: true,
	};

	return await this.helpers.httpRequest(options);
}
