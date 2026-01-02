import { Dispatch } from "redux";
import axios from "axios";
import { Toast } from "primereact/toast";
import { 
  FETCH_WITHDRAW_REQUESTS_REQUEST,
  FETCH_WITHDRAW_REQUESTS_SUCCESS,
  FETCH_WITHDRAW_REQUESTS_FAILURE,
  CREATE_WITHDRAW_REQUEST_REQUEST,
  CREATE_WITHDRAW_REQUEST_SUCCESS,
  CREATE_WITHDRAW_REQUEST_FAILURE,
  UPDATE_WITHDRAW_STATUS_REQUEST,
  UPDATE_WITHDRAW_STATUS_SUCCESS,
  UPDATE_WITHDRAW_STATUS_FAILURE,
  SET_WITHDRAW_FILTERS,
  CLEAR_WITHDRAW_FILTERS
} from "../constants/withdrawalRequestConstants";
import { WithdrawRequest } from "@/types/interface";

const getAuthToken = () => {
  return localStorage.getItem("api_token") || "";
};

interface WithdrawFilters {
  status?: string;
  reseller_id?: number;
  currency_id?: number;
  payment_method_id?: number;
  start_date?: string;
  end_date?: string;
}

// Fetch Withdraw Requests with filters
export const fetchWithdrawRequests = (
  page: number = 1,
  filters?: WithdrawFilters
) => async (dispatch: Dispatch) => {
  dispatch({ type: FETCH_WITHDRAW_REQUESTS_REQUEST });

  try {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();

    queryParams.append('page', String(page));
    
    // Add filters if present
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/withdraw-requests${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    dispatch({ 
      type: FETCH_WITHDRAW_REQUESTS_SUCCESS, 
      payload: { 
        data: response.data.data.withdraw_requests || response.data,
        pagination: response.data.pagination || response.data.meta?.pagination || null
      } 
    });

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to fetch withdraw requests";
    dispatch({ type: FETCH_WITHDRAW_REQUESTS_FAILURE, payload: errorMessage });
  }
};

// Create Withdraw Request (Admin)
export const createWithdrawRequest = (
  data: {
    reseller_id: number;
    currency_id: number;
    amount: number;
    payment_method_id: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    notes?: string;
  },
  toast: React.RefObject<Toast>,
  t: (key: string) => string,
  onSuccess?: () => void
) => async (dispatch: Dispatch) => {
  dispatch({ type: CREATE_WITHDRAW_REQUEST_REQUEST });

  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/withdraw-requests`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    dispatch({ type: CREATE_WITHDRAW_REQUEST_SUCCESS, payload: response.data.data });
    
    toast.current?.show({
      severity: "success",
      summary: t("SUCCESS"),
      detail: t("WITHDRAW_REQUEST_CREATED_SUCCESSFULLY"),
      life: 3000,
    });

    if (onSuccess) onSuccess();

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to create withdraw request";
    dispatch({ type: CREATE_WITHDRAW_REQUEST_FAILURE, payload: errorMessage });
    
    toast.current?.show({
      severity: "error",
      summary: t("ERROR"),
      detail: errorMessage || t("WITHDRAW_REQUEST_CREATE_FAILED"),
      life: 3000,
    });
  }
};

// Update Withdraw Request Status (Approve/Reject)
export const updateWithdrawStatus = (
  id: number,
  status: 'approved' | 'rejected',
  toast: React.RefObject<Toast>,
  t: (key: string) => string,
  admin_note?: string,
  
  onSuccess?: () => void
) => async (dispatch: Dispatch) => {
  dispatch({ type: UPDATE_WITHDRAW_STATUS_REQUEST });

  try {
    const token = getAuthToken();
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_BASE_URL}/withdraw-requests/${id}/update-status`,
      { status, admin_note },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    dispatch({ type: UPDATE_WITHDRAW_STATUS_SUCCESS, payload: response.data.data });
    
    const statusText = status === 'approved' ? t("APPROVED") : t("REJECTED");
    toast.current?.show({
      severity: "success",
      summary: t("SUCCESS"),
      detail: `${t("WITHDRAW_REQUEST")} ${statusText} ${t("SUCCESSFULLY")}`,
      life: 3000,
    });

    if (onSuccess) onSuccess();

  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || "Failed to update withdraw status";
    dispatch({ type: UPDATE_WITHDRAW_STATUS_FAILURE, payload: errorMessage });
    
    toast.current?.show({
      severity: "error",
      summary: t("ERROR"),
      detail: errorMessage || t("WITHDRAW_STATUS_UPDATE_FAILED"),
      life: 3000,
    });
  }
};

// Set Filters
export const setWithdrawFilters = (filters: WithdrawFilters) => (dispatch: Dispatch) => {
  dispatch({ type: SET_WITHDRAW_FILTERS, payload: filters });
};

// Clear Filters
export const clearWithdrawFilters = () => (dispatch: Dispatch) => {
  dispatch({ type: CLEAR_WITHDRAW_FILTERS });
};