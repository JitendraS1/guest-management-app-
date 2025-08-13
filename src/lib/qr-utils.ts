import QRCode from 'qrcode';
import { QRData } from '@/types';

export const generateQRCode = async (data: QRData): Promise<string> => {
  try {
    const qrString = JSON.stringify(data);
    const qrCodeDataURL = await QRCode.toDataURL(qrString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

export const parseQRData = (qrString: string): QRData | null => {
  try {
    console.log('Attempting to parse QR string:', qrString);
    let data;
    try {
      data = JSON.parse(qrString);
    } catch (jsonError) {
      // If it's not valid JSON, check if it's a simple string that might be an invite code
      console.log('Not valid JSON, checking if it might be an invite code');
      if (typeof qrString === 'string' && qrString.trim().length > 0) {
        // Try to get guest by invite code
        console.log('Treating as invite code:', qrString.trim());
        return {
          guestId: 'unknown', // Will be looked up by invite code
          eventId: 'unknown', // Will be determined by selected event
          inviteCode: qrString.trim()
        };
      }
      throw jsonError;
    }
    
    console.log('Parsed data:', data);
    if (data.guestId && data.eventId && data.inviteCode) {
      return data as QRData;
    }
    return null;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
};

export const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};