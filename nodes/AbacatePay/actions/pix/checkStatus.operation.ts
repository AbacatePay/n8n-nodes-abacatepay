import { IExecuteFunctions, IDataObject, IHttpRequestOptions } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

export const description: INodeProperties[] = [
	{
		displayName: 'PIX QR Code ID',
		name: 'pixId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID do QR Code PIX para verificar o status',
		displayOptions: {
			show: {
				resource: ['pix'],
				operation: ['checkStatus'],
			},
		},
	},
];

export async function execute(this: IExecuteFunctions, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('abacatePayApi');

	// Get PIX ID
	const pixId = this.getNodeParameter('pixId', i) as string;

	const options: IHttpRequestOptions = {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}/v1/pixQrCode/check?id=${pixId}`,
		json: true,
	};

	return await this.helpers.httpRequest(options);
}
