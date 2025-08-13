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
    const data = JSON.parse(qrString);
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