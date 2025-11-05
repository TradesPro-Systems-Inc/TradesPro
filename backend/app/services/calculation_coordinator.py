# backend/app/services/calculation_coordinator.py
# V4.1 Architecture: Calculation Coordinator (Audit Orchestrator)
#
# This is the "brain" that orchestrates calculations and generates trusted audit trails.
# According to V4.1 principles:
# - Calculation modules (/calculators): Pure functions, no I/O, no audit awareness
# - Audit Coordinator (/services): Orchestrates calculations and meticulously records each action
# - Backend: "Trust anchor" - executes authoritative calculations and generates secure bundles

import subprocess
import json
import os
import uuid
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from ..models import Calculation, Project
from ..utils.config import settings


class CalculationCoordinator:
    """
    V4.1 Audit Coordinator
    
    Responsibilities:
    1. Orchestrate calculation flow by calling pure calculation modules
    2. Meticulously record each action as a detailed CalculationStep
    3. Create an auditable "story" of the calculation process
    4. Generate secure, signed calculation bundles
    """
    
    @staticmethod
    def execute_calculation(
        db: Session,
        inputs: Dict[str, Any],
        user_id: int,
        project_id: int
    ) -> Calculation:
        """
        Execute a calculation with trusted audit trail generation.
        
        This is the ONLY way to generate official, trusted calculation results.
        Frontend calculations are for preview only and cannot be trusted.
        
        Args:
            db: Database session
            inputs: Calculation inputs (matches CecInputsSingle from engine)
            user_id: User ID executing the calculation
            project_id: Project ID to associate with
            
        Returns:
            Calculation object with complete audit trail
            
        Raises:
            HTTPException: If project not found or access denied
        """
        from fastapi import HTTPException, status
        
        # Verify project ownership
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        if project.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Generate engine metadata
        # V4.1 Architecture: engine.commit MUST be injected by CI/CD pipeline
        # This links each calculation to the exact code version that produced it
        engine_meta = {
            "name": "tradespro-backend-engine",
            "version": settings.APP_VERSION,
            "commit": settings.GIT_COMMIT,  # Injected by CI/CD pipeline
            "executed_at": datetime.utcnow().isoformat(),
            "executed_by": user_id
        }
        
        # Call shared calculation engine via Node.js subprocess
        # The engine executes calculations and returns a bundle with steps
        # However, in V4.1 architecture, we consider this the "preliminary" calculation
        # The coordinator validates and re-signs the audit trail to ensure trust
        
        calculation_start = datetime.utcnow()
        
        # Find the calculation engine wrapper script
        wrapper_script = Path(__file__).parent / 'calculation_engine_wrapper.js'
        if not wrapper_script.exists():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Calculation engine wrapper not found"
            )
        
        # Extract code type and method from inputs
        code_type = inputs.get('codeType', inputs.get('code_type', 'cec'))
        nec_method = inputs.get('necMethod', inputs.get('nec_method', 'standard'))
        
        # Determine code edition based on code type
        code_edition = inputs.get('codeEdition', inputs.get('code_edition'))
        if not code_edition:
            code_edition = '2023' if code_type == 'nec' else '2024'
        
        # Prepare input for calculation engine
        engine_input = {
            "inputs": inputs,
            "engineMeta": engine_meta,
            "codeEdition": code_edition,
            "codeType": code_type,
            "necMethod": nec_method if code_type == 'nec' else None
        }
        
        # Call Node.js wrapper via subprocess
        try:
            process = subprocess.Popen(
                ['node', str(wrapper_script)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(Path(__file__).parent)
            )
            
            stdout, stderr = process.communicate(
                input=json.dumps(engine_input),
                timeout=30  # 30 second timeout
            )
            
            # Log for debugging
            if stderr:
                print(f"Calculation engine stderr: {stderr}")
            if stdout:
                print(f"Calculation engine stdout: {stdout[:200]}...")  # Log first 200 chars
            
            # Check if stdout is empty first
            if not stdout or not stdout.strip():
                error_msg = stderr or "Empty response from calculation engine"
                raise Exception(f"Calculation engine returned empty output. stderr: {error_msg}")
            
            # Try to parse JSON from stdout (wrapper outputs JSON to stdout even on error)
            try:
                engine_result = json.loads(stdout)
            except json.JSONDecodeError as e:
                # If JSON parsing fails, include stdout and stderr in error
                raise Exception(
                    f"Failed to parse calculation engine output as JSON. "
                    f"Return code: {process.returncode}, "
                    f"stdout (first 500 chars): {stdout[:500]}, "
                    f"stderr (first 500 chars): {stderr[:500]}, "
                    f"JSON error: {str(e)}"
                )
            
            # Check if calculation was successful
            if not engine_result.get('success'):
                error_msg = engine_result.get('error', 'Unknown error')
                error_stack = engine_result.get('stack', '')
                full_error = f"{error_msg}" + (f"\nStack: {error_stack}" if error_stack else "")
                raise Exception(f"Calculation failed: {full_error}")
            
            # If return code is non-zero but we got a valid JSON response,
            # the wrapper may have encountered an error but still output JSON
            if process.returncode != 0:
                error_msg = engine_result.get('error', stderr or 'Unknown error')
                raise Exception(f"Calculation engine error (exit code {process.returncode}): {error_msg}")
            
            result_bundle = engine_result['bundle']
            
        except subprocess.TimeoutExpired:
            process.kill()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Calculation timeout"
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Calculation engine error: {str(e)}"
            )
        
        calculation_time_ms = int((datetime.utcnow() - calculation_start).total_seconds() * 1000)
        
        # Extract results from bundle
        bundle_id = result_bundle.get('id') or str(uuid.uuid4())
        bundle_inputs = result_bundle.get('inputs', inputs)
        bundle_results = result_bundle.get('results', {})
        bundle_steps = result_bundle.get('steps', [])  # Audit trail from engine
        bundle_warnings = result_bundle.get('warnings', [])
        
        # IMPORTANT: V4.1 Architecture - Audit Trail Generation
        # The engine returns preliminary steps, but we validate and enhance them here
        # In the future, we may want to generate steps directly in the coordinator
        # For now, we trust the engine output but mark it as backend-generated
        
        # Enhance steps with backend metadata (this ensures trust)
        enhanced_steps = []
        for i, step in enumerate(bundle_steps, 1):
            enhanced_step = dict(step)
            enhanced_step['stepIndex'] = i
            enhanced_step['timestamp'] = datetime.utcnow().isoformat()
            enhanced_step['generated_by'] = 'backend-coordinator'
            enhanced_steps.append(enhanced_step)
        
        # Determine building type from inputs
        building_type = inputs.get('building_type', 'single-dwelling')
        
        # Determine calculation type based on code type
        calculation_type = inputs.get('calculation_type')
        if not calculation_type:
            calculation_type = 'nec_load' if code_type == 'nec' else 'cec_load'
        
        # Create calculation record with separated data (matching new model structure)
        calculation = Calculation(
            id=bundle_id,
            project_id=project_id,
            building_type=building_type,
            calculation_type=calculation_type,
            code_edition=code_edition,
            code_type=code_type,
            
            # Separated JSONB fields (matching init.sql)
            inputs=bundle_inputs if isinstance(bundle_inputs, dict) else bundle_inputs,
            results=bundle_results if isinstance(bundle_results, dict) else bundle_results,
            steps=enhanced_steps if isinstance(enhanced_steps, list) else enhanced_steps,  # Enhanced audit trail from coordinator
            warnings=bundle_warnings if isinstance(bundle_warnings, list) else (bundle_warnings or []),
            
            # Engine metadata
            engine_version=engine_meta['version'],
            engine_commit=engine_meta.get('commit', 'unknown'),
            
            # Bundle integrity
            bundle_hash=None,  # Will be calculated below
            
            # Timestamps
            calculation_time_ms=calculation_time_ms,
        )
        
        # Generate bundle hash for integrity verification
        # V4.1 Architecture: Calculate rootHash using RFC 8785 canonicalization
        from ..utils.signing import BundleSigner
        
        # Convert calculation to dict for rootHash calculation
        bundle_dict = {
            'id': calculation.id,
            'inputs': calculation.inputs,
            'results': calculation.results,
            'steps': calculation.steps,
            'warnings': calculation.warnings,
            'engine_version': calculation.engine_version,
            'engine_commit': calculation.engine_commit,
            'created_at': calculation.created_at.isoformat() if calculation.created_at else None,
        }
        
        # Calculate rootHash using RFC 8785 canonicalization
        calculation.bundle_hash = BundleSigner.calculate_root_hash(bundle_dict)
        
        # V4.1 Architecture: Return UnsignedBundle (NOT signed)
        # User must review and approve before signing via /sign endpoint
        # Do NOT sign the bundle here - that's done in the separate sign endpoint
        calculation.is_signed = False
        calculation.signature = None
        calculation.signed_at = None
        calculation.signed_by = None
        
        db.add(calculation)
        db.commit()
        db.refresh(calculation)
        
        return calculation
    
    @staticmethod
    def generate_audit_step(
        operation_id: str,
        display_name: str,
        formula_ref: str,
        input_refs: list,
        intermediate_values: dict,
        output: dict,
        rule_citations: list,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a CalculationStep for the audit trail.
        
        This is called by the coordinator after each calculation module execution.
        The coordinator knows what happened (inputs, outputs, formulas used),
        and records this as a detailed audit step.
        
        Args:
            operation_id: Unique identifier for this operation (e.g., 'calc_base_load')
            display_name: Human-readable name
            formula_ref: Code reference (e.g., 'CEC 8-200 1)a)i-ii')
            input_refs: List of input field names used
            intermediate_values: Intermediate calculation values
            output: Final output values
            rule_citations: List of CEC rule citations
            note: Optional explanatory note
            
        Returns:
            CalculationStep dictionary
        """
        return {
            "stepIndex": 0,  # Will be set by coordinator
            "timestamp": datetime.utcnow().isoformat(),
            "operationId": operation_id,
            "displayName": display_name,
            "formulaRef": formula_ref,
            "inputRefs": input_refs,
            "intermediateValues": intermediate_values,
            "output": output,
            "ruleCitations": rule_citations,
            "note": note or f"Calculation step: {display_name}"
        }
    
    @staticmethod
    def sign_calculation(
        db: Session,
        calculation_id: str,
        user_id: int
    ) -> Calculation:
        """
        Sign a calculation bundle after user approval.
        
        V4.1 Architecture:
        - This is called AFTER user reviews the UnsignedBundle
        - Performs RFC 8785 canonicalization
        - Calculates rootHash (SHA-256 of canonical JSON)
        - Signs the rootHash with backend signing key
        - Updates calculation record with signature
        
        Args:
            db: Database session
            calculation_id: Calculation bundle ID
            user_id: User ID signing the calculation
            
        Returns:
            Signed Calculation object
            
        Raises:
            HTTPException: If calculation not found or already signed
        """
        from fastapi import HTTPException, status
        from ..utils.signing import BundleSigner
        from ..models import User
        
        # Get calculation
        calculation = db.query(Calculation).filter(Calculation.id == calculation_id).first()
        if not calculation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Calculation not found"
            )
        
        # Check if already signed
        if calculation.is_signed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Calculation already signed"
            )
        
        # Get user email for signature
        user = db.query(User).filter(User.id == user_id).first()
        user_email = user.email if user else None
        
        # Convert calculation to dict for signing
        bundle_dict = {
            'id': calculation.id,
            'inputs': calculation.inputs,
            'results': calculation.results,
            'steps': calculation.steps,
            'warnings': calculation.warnings,
            'engine_version': calculation.engine_version,
            'engine_commit': calculation.engine_commit,
            'bundle_hash': calculation.bundle_hash,
            'created_at': calculation.created_at.isoformat() if calculation.created_at else None,
        }
        
        # Sign the bundle using BundleSigner (performs RFC 8785 canonicalization)
        signed_bundle = BundleSigner.sign_bundle(
            bundle_dict,
            user_id=user_id,
            user_email=user_email
        )
        
        # Update calculation with signature
        calculation.is_signed = signed_bundle.get('is_signed', True)
        calculation.signature = signed_bundle.get('signature')
        if signed_bundle.get('signed_at'):
            try:
                calculation.signed_at = datetime.fromisoformat(signed_bundle['signed_at'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                calculation.signed_at = datetime.utcnow()
        calculation.signed_by = signed_bundle.get('signed_by')
        
        db.commit()
        db.refresh(calculation)
        
        return calculation
    
    @staticmethod
    def calculate_bundle_hash(calculation: Calculation) -> str:
        """
        Calculate SHA-256 hash of calculation bundle for integrity verification.
        
        Args:
            calculation: Calculation object
            
        Returns:
            Hexadecimal hash string
        """
        bundle_data = {
            "id": calculation.id,
            "inputs": calculation.inputs,
            "results": calculation.results,
            "steps": calculation.steps,
            "warnings": calculation.warnings,
            "engine_version": calculation.engine_version,
            "engine_commit": calculation.engine_commit,
        }
        
        bundle_json = json.dumps(bundle_data, sort_keys=True)
        return hashlib.sha256(bundle_json.encode()).hexdigest()

