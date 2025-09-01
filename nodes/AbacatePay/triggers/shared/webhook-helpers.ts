import { IDataObject } from 'n8n-workflow';

/**
 * Extract and normalize webhook data from different AbacatePay webhook formats
 */
export function extractWebhookData(bodyData: any): { data: IDataObject; eventType: string } {
	let data: IDataObject = {};
	let eventType = 'unknown';

	if (bodyData && typeof bodyData === 'object') {
		// Check for nested data structure
		if ('data' in bodyData && bodyData.data) {
			data = bodyData.data;
		} else {
			data = bodyData;
		}

		// Determine event type from various possible fields
		if ('event' in bodyData && typeof bodyData.event === 'string') {
			eventType = bodyData.event;
		} else if ('action' in bodyData && typeof bodyData.action === 'string') {
			eventType = bodyData.action;
		} else if ('type' in bodyData && typeof bodyData.type === 'string') {
			eventType = bodyData.type;
		}
	}

	return { data, eventType };
}

/**
 * Validate if webhook data contains expected fields for a specific resource
 */
export function validateWebhookData(data: IDataObject, requiredFields: string[]): boolean {
	return requiredFields.some(field => field in data && data[field] !== undefined);
}

/**
 * Convert amount from cents to reais with proper formatting
 */
export function formatAmount(amountInCents: number): string {
	return (amountInCents / 100).toFixed(2);
}

/**
 * Calculate net amount after platform fee
 */
export function calculateNetAmount(amount: number, platformFee: number): number {
	return amount - platformFee;
}

/**
 * Determine document type from Brazilian tax ID
 */
export function getDocumentType(taxId: string): 'CPF' | 'CNPJ' | 'UNKNOWN' {
	const cleanTaxId = taxId.replace(/[^\d]/g, '');
	if (cleanTaxId.length === 11) return 'CPF';
	if (cleanTaxId.length === 14) return 'CNPJ';
	return 'UNKNOWN';
}

/**
 * Extract email domain from email address
 */
export function getEmailDomain(email: string): string {
	return email && email.includes('@') ? email.split('@')[1].toLowerCase() : '';
}

/**
 * Check if email domain is from common personal providers
 */
export function isPersonalEmail(email: string): boolean {
	const domain = getEmailDomain(email);
	const personalDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
	return personalDomains.includes(domain);
}

/**
 * Parse full name into components
 */
export function parseFullName(fullName: string): {
	full: string;
	first: string;
	last: string;
	parts: string[];
	wordCount: number;
} {
	const parts = fullName ? fullName.trim().split(' ').filter(part => part.length > 0) : [];
	return {
		full: fullName || '',
		first: parts[0] || '',
		last: parts.length > 1 ? parts[parts.length - 1] : '',
		parts,
		wordCount: parts.length,
	};
}
