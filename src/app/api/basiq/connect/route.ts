import { NextResponse } from 'next/server';
import { BasiqService } from '@/lib/basiq/service';
import type { BasiqConfig } from '@/lib/basiq/types';

const basiqConfig: BasiqConfig = {
  apiKey: process.env.BASIQ_API_KEY || '',
  applicationId: process.env.NEXT_PUBLIC_BASIQ_APPLICATION_ID || '',
  environment: 'sandbox' as const,
};

export async function POST(request: Request) {
  try {
    const { email, phone, bankId } = await request.json();

    if (!email || !bankId || !phone) {
      return NextResponse.json(
        { error: 'Email, phone, and bank ID are required' },
        { status: 400 }
      );
    }

    console.log('Starting bank connection process for:', { email, phone, bankId });
    console.log('Using config:', {
      applicationId: process.env.NEXT_PUBLIC_BASIQ_APPLICATION_ID,
      environment: basiqConfig.environment,
    });

    // Get token
    const apiKey = process.env.BASIQ_API_KEY;
    if (!apiKey) {
      throw new Error('API key is not configured');
    }

    const tokenResponse = await fetch('https://au-api.basiq.io/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${apiKey}`,
        'basiq-version': '3.0',
        'Accept': 'application/json'
      } as HeadersInit,
      body: 'scope=SERVER_ACCESS',
    });

    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return NextResponse.json(
        { error: 'No access token in response', details: tokenData },
        { status: 500 }
      );
    }

    console.log('Successfully obtained access token');

    // Function to make authenticated requests
    const makeAuthenticatedRequest = async (url: string, method: string, body: any) => {
      console.log(`Making ${method} request to ${url}`, body ? { body } : '(no body)');
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'basiq-version': '3.0',
        'Accept': 'application/json'
      };

      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      try {
        const response = await fetch(url, {
          method,
          headers,
          ...(body && { body: JSON.stringify(body) })
        });

        const data = await response.json();
        console.log(`${method} ${url} response status:`, response.status);
        console.log(`${method} ${url} response data:`, data);

        // If we got a URL in the response, consider it a success regardless of status
        if (data.url || (data.data && data.data.url)) {
          return { response, data, success: true };
        }

        return { response, data };
      } catch (error) {
        console.error(`Error in ${method} ${url}:`, error);
        throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    try {
      // Check if user already exists
      const { response: checkUserResponse, data: existingUserData } = await makeAuthenticatedRequest(
        `https://au-api.basiq.io/users?filter=email.eq('${encodeURIComponent(email)}')`,
        'GET',
        null
      );

      let userId;

      if (existingUserData?.data?.length > 0) {
        console.log('User already exists, using existing user');
        userId = existingUserData.data[0].id;

        // Update user with new phone number
        const { response: updateResponse, data: updateData } = await makeAuthenticatedRequest(
          `https://au-api.basiq.io/users/${userId}`,
          'POST',
          { email, mobile: phone }
        );

        if (!updateResponse.ok) {
          console.error('Failed to update user:', updateData);
          throw new Error(`Failed to update user: ${JSON.stringify(updateData)}`);
        } else {
          console.log('Successfully updated user with new phone number');
        }
      } else {
        // Create new user
        console.log('Creating new user with payload:', { email, mobile: phone });
        const { response: userResponse, data: userData } = await makeAuthenticatedRequest(
          'https://au-api.basiq.io/users',
          'POST',
          { email, mobile: phone }
        );

        if (!userResponse.ok) {
          console.error('User creation error:', userData);
          throw new Error(`Failed to create user: ${JSON.stringify(userData)}`);
        }

        console.log('Successfully created new user:', userData.id);
        userId = userData.id;
      }

      // Create auth link
      const authLinkPayload = {
        institutionId: bankId,
        mobile: phone
      };

      console.log('Creating auth link with payload:', authLinkPayload);

      const { response: authLinkResponse, data: authLinkData, success } = await makeAuthenticatedRequest(
        `https://au-api.basiq.io/users/${userId}/auth_link`,
        'POST',
        authLinkPayload
      );

      // Check multiple possible locations for the URL
      const authLinkUrl = 
        authLinkData.url || // direct url
        authLinkData.links?.public || // public link (this is where Basiq actually puts it)
        (authLinkData.data && typeof authLinkData.data === 'object' && 'url' in authLinkData.data && authLinkData.data.url) || // nested in data object
        (Array.isArray(authLinkData.data) && authLinkData.data[0]?.url) || // nested in data array
        (typeof authLinkData === 'string' && authLinkData.includes('connect.basiq.io') ? authLinkData : null); // direct string that looks like a Basiq URL

      console.log('Extracted auth link URL:', authLinkUrl);

      if (authLinkUrl || success) {
        console.log('Successfully found auth link URL');
        return NextResponse.json({
          success: true,
          userId: userId,
          authLink: authLinkUrl || `https://connect.basiq.io/${authLinkData.id}?action=connect`
        });
      }

      // If we get here, something unexpected happened
      throw new Error(`No auth link URL found in response: ${JSON.stringify(authLinkData)}`);
    } catch (error) {
      console.error('Operation failed:', error);
      return NextResponse.json(
        { 
          error: 'Failed to connect to bank', 
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Top level error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to bank', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 