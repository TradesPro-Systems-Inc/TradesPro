// frontend/src/composables/useCecCalculation.ts
// V4.1 Architecture: CEC Calculation Composable
// 
// This composable handles the complete V4.1 workflow:
// 1. Execute calculation → returns UnsignedBundle
// 2. User reviews results and audit trail
// 3. User approves → sign bundle → returns SignedBundle

import { ref, computed } from 'vue';
import api from '../services/api';
import type { CecInputsSingle, UnsignedBundle, CodeType } from '@tradespro/calculation-engine';

import type { CodeEdition } from '@tradespro/calculation-engine';

export interface CalculationInputs extends CecInputsSingle {
  building_type?: 'single-dwelling' | 'apartment' | 'school';
  calculation_type?: string;
  codeEdition?: CodeEdition;
  codeType?: string;
}

export interface CalculationResponse {
  id: string;
  project_id: number;
  building_type: string;
  calculation_type: string;
  code_edition: string;
  code_type: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  steps: any[];
  warnings: string[];
  engine_version: string;
  engine_commit: string;
  bundle_hash: string;  // Note: Backend uses bundle_hash, frontend should use rootHash
  is_signed: boolean;
  signed_at?: string;
  signed_by?: string;
  created_at: string;
  calculation_time_ms?: number;
}

export function useCecCalculation() {
  // State
  const loading = ref(false);
  const error = ref<string | null>(null);
  const bundle = ref<UnsignedBundle | null>(null);
  const calculationId = ref<string | null>(null);
  const calculationTimeMs = ref<number>(0);
  const isSigned = ref(false);

  // Computed
  const hasResults = computed(() => bundle.value !== null);
  const hasWarnings = computed(() => (bundle.value?.warnings?.length ?? 0) > 0);
  const hasErrors = computed(() => error.value !== null);

  const results = computed(() => bundle.value?.results ?? null);
  const steps = computed(() => bundle.value?.steps ?? []);
  const engineCommit = computed(() => {
    // Try to get from bundle.meta.engine or from response
    return (bundle.value as any)?.meta?.engine?.commit 
      ?? (bundle.value as any)?.engine?.commit 
      ?? 'unknown';
  });

  // Methods
  /**
   * Execute a calculation on the backend.
   * V4.1 Architecture: Returns UnsignedBundle (NOT signed)
   * User must review and approve before signing.
   * 
   * @param inputs - Calculation inputs (CecInputsSingle)
   * @param projectId - Project ID to associate with
   * @returns CalculationResponse with UnsignedBundle
   */
  async function executeCalculation(
    inputs: CalculationInputs,
    projectId: number,
    codeType: CodeType = 'cec',
    necMethod: 'standard' | 'optional' = 'standard'
  ): Promise<CalculationResponse | null> {
    loading.value = true;
    error.value = null;
    bundle.value = null;
    calculationId.value = null;

    try {
      // Validate inputs before sending to backend
      if (!inputs.livingArea_m2 || inputs.livingArea_m2 <= 0) {
        throw new Error('Living area must be a positive number. Please enter a valid living area.');
      }

      // V4.1 Architecture: POST /api/v1/calculations (V4.1 specification)
      // Returns UnsignedBundleV4 with trusted audit trail from backend
      // Note: baseURL should be http://localhost:8000/api, so we need /v1/calculations
      // FastAPI expects inputs directly in the request body (not wrapped) and project_id as a query parameter
      // The route signature is: create_calculation(inputs: dict, project_id: int, ...)
      // So we send the inputs object directly as the body
      
      // Ensure livingArea_m2 is a valid number before sending
      const sanitizedInputs = {
        ...inputs,
        livingArea_m2: Number(inputs.livingArea_m2) || 0,
        // Add code type and method for backend
        codeType: codeType,
        codeEdition: codeType === 'nec' ? '2023' : '2024',
        necMethod: codeType === 'nec' ? necMethod : undefined
      };
      
      console.log('📤 Sending calculation request:', {
        url: '/v1/calculations',
        body: sanitizedInputs,
        inputsKeys: Object.keys(sanitizedInputs || {}),
        livingArea_m2: sanitizedInputs.livingArea_m2,
        livingAreaType: typeof sanitizedInputs.livingArea_m2,
        projectId: projectId
      });
      
      // project_id is expected as a query parameter, not in the request body
      // FastAPI will extract 'inputs' from the body directly (based on function parameter name)
      const response = await api.post<CalculationResponse>(`/v1/calculations?project_id=${projectId}`, sanitizedInputs);

      const calculation = response.data;

      // Convert backend response to UnsignedBundle format
      // Note: Backend response may not include all UnsignedBundle fields, so we construct a minimal bundle
      bundle.value = {
        id: calculation.id,
        createdAt: calculation.created_at,
        domain: 'electrical',
        calculationType: (calculation.code_type === 'nec' ? 'nec_load' : 'cec_load') as 'cec_load' | 'nec_load',
        buildingType: calculation.building_type as 'single-dwelling',
        engine: {
          name: 'tradespro-backend-engine',
          version: calculation.engine_version || '1.0.0',
          commit: calculation.engine_commit || 'unknown'
        },
        ruleSets: [], // Backend doesn't return ruleSets, but it's required
        inputs: calculation.inputs as any,
        results: calculation.results as any,
        steps: calculation.steps,
        warnings: calculation.warnings || [],
        meta: {
          canonicalization_version: '1.0',
          numeric_format: 'decimal',
          calculation_standard: calculation.code_type === 'nec' ? 'NEC-2023' : 'CEC-2024',
          tables_used: [],
          build_info: {
            commit: calculation.engine_commit || 'unknown',
            build_timestamp: calculation.created_at,
            environment: 'production'
          }
        }
      } as UnsignedBundle;

      calculationId.value = calculation.id;
      calculationTimeMs.value = calculation.calculation_time_ms || 0;
      isSigned.value = calculation.is_signed;

      return calculation;
    } catch (err: any) {
      console.error('Calculation execution error:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          method: err.config?.method
        }
      });
      
      // Provide user-friendly error messages
      let errorMsg = 'Unknown error occurred';
      
      if (err.response) {
        // HTTP error response
        const status = err.response.status;
        const data = err.response.data;
        
        if (status === 404) {
          errorMsg = 'Calculation service not found. Please check your network connection and try again.';
        } else if (status === 400) {
          errorMsg = data?.detail || data?.message || data?.error?.message || 'Invalid calculation inputs. Please check your inputs and try again.';
        } else if (status === 401) {
          errorMsg = 'Authentication required. Please login and try again.';
        } else if (status === 403) {
          errorMsg = 'Access forbidden. Please check your authentication and try again.';
          console.error('403 Forbidden - Authentication issue:', {
            hasToken: !!err.config?.headers?.Authorization,
            tokenLength: err.config?.headers?.Authorization?.length
          });
        } else if (status === 422) {
          // 422 Unprocessable Entity - Validation errors
          // FastAPI returns validation errors in a specific format
          console.error('422 Validation Error Details:', JSON.stringify(data, null, 2));
          if (Array.isArray(data?.detail)) {
            // Multiple validation errors
            const validationErrors = data.detail.map((err: any) => {
              const field = err.loc?.slice(1).join('.') || 'unknown'; // Remove first item (usually 'body')
              const msg = err.msg || 'Invalid value';
              return `${field}: ${msg}`;
            }).join(', ');
            errorMsg = `Validation errors: ${validationErrors}`;
          } else if (typeof data?.detail === 'string') {
            errorMsg = data.detail;
          } else {
            errorMsg = data?.detail || data?.message || data?.error?.message || 'Invalid request format. Please check your inputs.';
          }
        } else if (status === 500) {
          // Internal server error - try to get detailed error message
          const detail = data?.detail || data?.message || data?.error?.message;
          if (detail) {
            errorMsg = `Server error: ${detail}`;
            console.error('500 Server Error Details:', JSON.stringify(data, null, 2));
          } else {
            errorMsg = 'Calculation service error. Please check the backend logs and try again later.';
          }
        } else {
          errorMsg = data?.detail || data?.message || data?.error?.message || `Calculation failed (${status})`;
        }
      } else if (err.request) {
        // Network error - backend is not reachable
        const requestUrl = `${err.config?.baseURL}${err.config?.url}`;
        const isTimeout = err.code === 'ECONNABORTED' || err.message.includes('timeout');
        const isConnectionError = err.code === 'ERR_NETWORK' || err.code === 'ERR_CONNECTION_TIMED_OUT';
        
        console.error('Network error - Backend not reachable:', {
          requestUrl,
          message: err.message,
          code: err.code,
          isTimeout,
          isConnectionError,
          baseURL: err.config?.baseURL
        });
        
        // Provide more helpful error messages based on error type
        if (isTimeout || isConnectionError) {
          if (requestUrl.includes('ngrok')) {
            errorMsg = 'Connection timeout to ngrok backend. This usually means:\n' +
              '1. ngrok tunnel may be down (check ngrok terminal)\n' +
              '2. ngrok URL may have expired (restart ngrok to get new URL)\n' +
              '3. Backend service may not be running\n' +
              'See NGROK_CONNECTION_TIMEOUT_FIX.md for troubleshooting steps.';
          } else {
            errorMsg = 'Connection timeout. Please check:\n' +
              '1. Backend service is running on the configured port\n' +
              '2. Network connection is stable\n' +
              '3. Firewall is not blocking the connection';
          }
        } else {
          errorMsg = 'Network error. Please check your internet connection and ensure the backend service is running.';
        }
      } else {
        // Other error
        errorMsg = err.message || 'An unexpected error occurred during calculation.';
      }
      
      error.value = errorMsg;
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Sign a calculation bundle after user approval.
   * V4.1 Architecture: POST /api/v1/calculations/{id}/sign
   * Performs RFC 8785 canonicalization, calculates rootHash, and signs with backend key.
   * 
   * @param calcId - Calculation bundle ID (optional, uses current calculationId if not provided)
   * @returns Signed CalculationResponse
   */
  async function signCalculation(calcId?: string): Promise<CalculationResponse | null> {
    const id = calcId || calculationId.value;
    
    if (!id) {
      error.value = 'No calculation ID available to sign';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      // V4.1 Architecture: POST /api/v1/calculations/{id}/sign
      // Signs the UnsignedBundle after user approval
      const response = await api.post<CalculationResponse>(`/v1/calculations/${id}/sign`);

      const signedCalculation = response.data;

      // Update bundle with signed information
      if (bundle.value) {
        bundle.value = {
          ...bundle.value,
          meta: {
            ...bundle.value.meta,
            isSigned: true,
            signedAt: signedCalculation.signed_at,
            signedBy: signedCalculation.signed_by,
            rootHash: signedCalculation.bundle_hash  // Updated rootHash after signing
          }
        } as UnsignedBundle;
      }

      isSigned.value = true;

      return signedCalculation;
    } catch (err: any) {
      console.error('Calculation signing error:', err);
      error.value = err.response?.data?.detail || err.message || 'Failed to sign calculation';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a calculation by ID from the backend.
   * 
   * @param calcId - Calculation bundle ID
   * @returns CalculationResponse
   */
  async function fetchCalculation(calcId: string): Promise<CalculationResponse | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get<CalculationResponse>(`/v1/calculations/${calcId}`);

      const calculation = response.data;

      // Convert backend response to UnsignedBundle format
      // Convert backend response to UnsignedBundle format (same structure as above)
      bundle.value = {
        id: calculation.id,
        createdAt: calculation.created_at,
        domain: 'electrical',
        calculationType: (calculation.code_type === 'nec' ? 'nec_load' : 'cec_load') as 'cec_load' | 'nec_load',
        buildingType: calculation.building_type as 'single-dwelling',
        engine: {
          name: 'tradespro-backend-engine',
          version: calculation.engine_version || '1.0.0',
          commit: calculation.engine_commit || 'unknown'
        },
        ruleSets: [], // Backend doesn't return ruleSets, but it's required
        inputs: calculation.inputs as any,
        results: calculation.results as any,
        steps: calculation.steps,
        warnings: calculation.warnings || [],
        meta: {
          canonicalization_version: '1.0',
          numeric_format: 'decimal',
          calculation_standard: calculation.code_type === 'nec' ? 'NEC-2023' : 'CEC-2024',
          tables_used: [],
          build_info: {
            commit: calculation.engine_commit || 'unknown',
            build_timestamp: calculation.created_at,
            environment: 'production'
          }
        }
      } as UnsignedBundle;

      calculationId.value = calculation.id;
      isSigned.value = calculation.is_signed;

      return calculation;
    } catch (err: any) {
      console.error('Fetch calculation error:', err);
      error.value = err.response?.data?.detail || err.message || 'Failed to fetch calculation';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Validate calculation inputs before execution.
   * 
   * @param inputs - Calculation inputs to validate
   * @returns True if inputs are valid
   */
  async function validateInputs(inputs: CalculationInputs): Promise<boolean> {
    try {
      // TODO: Implement validation endpoint or client-side validation
      // For now, basic validation
      if (!inputs.systemVoltage || inputs.systemVoltage <= 0) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Reset all state.
   */
  function reset() {
    bundle.value = null;
    calculationId.value = null;
    error.value = null;
    calculationTimeMs.value = 0;
    isSigned.value = false;
  }

  /**
   * Export bundle as JSON string.
   */
  function exportBundle(): string {
    if (!bundle.value) {
      return '';
    }
    return JSON.stringify(bundle.value, null, 2);
  }

  return {
    // State
    loading,
    error,
    bundle,
    calculationId,
    calculationTimeMs,
    isSigned,
    
    // Computed
    hasResults,
    hasWarnings,
    hasErrors,
    results,
    steps,
    engineCommit,
    
    // Methods
    executeCalculation,
    signCalculation,
    fetchCalculation,
    validateInputs,
    reset,
    exportBundle
  };
}

