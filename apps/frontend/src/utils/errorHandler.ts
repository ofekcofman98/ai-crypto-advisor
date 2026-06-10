import axios from 'axios';

export function getAPIErrorMessage(
    err: unknown, 
    defaultMessage: string
): string {
  
    if (axios.isAxiosError(err) && err.response?.data?.message) {
        return err.response.data.message;
    }
  
    return defaultMessage;
}