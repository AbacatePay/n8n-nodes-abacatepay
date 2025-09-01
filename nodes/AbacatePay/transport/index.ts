import { IExecuteFunctions, IHttpRequestOptions, IHttpRequestMethods } from 'n8n-workflow';

export async function apiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: any,
): Promise<any> {
	const credentials = await this.getCredentials('abacatePayApi');

	const options: IHttpRequestOptions = {
		method,
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		url: `${credentials.baseUrl}${endpoint}`,
		json: true,
	};

	if (body) {
		options.body = body;
	}

	return await this.helpers.httpRequest(options);
}
