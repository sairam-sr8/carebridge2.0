"""
Audit Service - Phase 4
Immutable audit logging with cryptographic hash chain
"""

import hashlib
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from models import Audit
from database import SessionLocal
import os

class AuditService:
    """Immutable audit service with cryptographic hash chain"""
    
    def __init__(self):
        self.secret_key = os.getenv("AUDIT_SECRET_KEY", "carebridge_audit_secret_2024")
        self.last_hash = None
    
    def _generate_hash(self, data: str, previous_hash: str = None) -> str:
        """Generate cryptographic hash for audit entry"""
        if previous_hash is None:
            previous_hash = self.last_hash or "genesis_hash"
        
        # Combine data, previous hash, and secret key
        combined = f"{data}|{previous_hash}|{self.secret_key}"
        
        # Generate SHA-256 hash
        return hashlib.sha256(combined.encode('utf-8')).hexdigest()
    
    def create_audit_entry(
        self,
        actor_id: int,
        actor_type: str,
        action: str,
        target_type: str = None,
        target_id: int = None,
        metadata: Dict[str, Any] = None,
        db: Session = None
    ) -> Audit:
        """Create immutable audit entry with hash chain"""
        
        if db is None:
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            # Get the last audit entry for hash chain
            last_audit = db.query(Audit).order_by(Audit.id.desc()).first()
            previous_hash = last_audit.hash_chain if last_audit else None
            
            # Create audit data string
            audit_data = {
                "actor_id": actor_id,
                "actor_type": actor_type,
                "action": action,
                "target_type": target_type,
                "target_id": target_id,
                "metadata": metadata or {},
                "timestamp": datetime.utcnow().isoformat()
            }
            
            audit_data_str = json.dumps(audit_data, sort_keys=True)
            
            # Generate hash chain
            hash_chain = self._generate_hash(audit_data_str, previous_hash)
            
            # Create audit entry
            audit_entry = Audit(
                actor_id=actor_id,
                actor_type=actor_type,
                action=action,
                target_type=target_type,
                target_id=target_id,
                metadata_json=metadata or {},
                hash_chain=hash_chain
            )
            
            db.add(audit_entry)
            db.commit()
            db.refresh(audit_entry)
            
            # Update last hash
            self.last_hash = hash_chain
            
            return audit_entry
            
        except Exception as e:
            db.rollback()
            raise Exception(f"Failed to create audit entry: {str(e)}")
        finally:
            if should_close:
                db.close()
    
    def verify_audit_chain(self, db: Session = None) -> Dict[str, Any]:
        """Verify the integrity of the audit chain"""
        
        if db is None:
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            # Get all audit entries in order
            audit_entries = db.query(Audit).order_by(Audit.id.asc()).all()
            
            if not audit_entries:
                return {
                    "valid": True,
                    "message": "No audit entries found",
                    "total_entries": 0
                }
            
            # Verify each entry
            verification_results = []
            previous_hash = None
            
            for i, entry in enumerate(audit_entries):
                # Recreate audit data
                audit_data = {
                    "actor_id": entry.actor_id,
                    "actor_type": entry.actor_type,
                    "action": entry.action,
                    "target_type": entry.target_type,
                    "target_id": entry.target_id,
                    "metadata": entry.metadata_json,
                    "timestamp": entry.timestamp.isoformat()
                }
                
                audit_data_str = json.dumps(audit_data, sort_keys=True)
                
                # Calculate expected hash
                expected_hash = self._generate_hash(audit_data_str, previous_hash)
                
                # Check if hash matches
                is_valid = entry.hash_chain == expected_hash
                
                verification_results.append({
                    "entry_id": entry.id,
                    "timestamp": entry.timestamp.isoformat(),
                    "action": entry.action,
                    "expected_hash": expected_hash,
                    "actual_hash": entry.hash_chain,
                    "valid": is_valid
                })
                
                if not is_valid:
                    break
                
                previous_hash = entry.hash_chain
            
            # Check overall validity
            all_valid = all(result["valid"] for result in verification_results)
            
            return {
                "valid": all_valid,
                "message": "Audit chain verification complete" if all_valid else "Audit chain integrity compromised",
                "total_entries": len(audit_entries),
                "verification_results": verification_results,
                "compromised_entries": [r for r in verification_results if not r["valid"]]
            }
            
        except Exception as e:
            return {
                "valid": False,
                "message": f"Verification failed: {str(e)}",
                "total_entries": 0
            }
        finally:
            if should_close:
                db.close()
    
    def get_audit_log(
        self,
        actor_id: int = None,
        actor_type: str = None,
        action: str = None,
        target_type: str = None,
        start_date: datetime = None,
        end_date: datetime = None,
        limit: int = 100,
        offset: int = 0,
        db: Session = None
    ) -> List[Dict[str, Any]]:
        """Get filtered audit log entries"""
        
        if db is None:
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            query = db.query(Audit)
            
            # Apply filters
            if actor_id:
                query = query.filter(Audit.actor_id == actor_id)
            if actor_type:
                query = query.filter(Audit.actor_type == actor_type)
            if action:
                query = query.filter(Audit.action == action)
            if target_type:
                query = query.filter(Audit.target_type == target_type)
            if start_date:
                query = query.filter(Audit.timestamp >= start_date)
            if end_date:
                query = query.filter(Audit.timestamp <= end_date)
            
            # Order by timestamp descending
            query = query.order_by(Audit.timestamp.desc())
            
            # Apply pagination
            query = query.offset(offset).limit(limit)
            
            # Execute query
            audit_entries = query.all()
            
            # Format results
            results = []
            for entry in audit_entries:
                results.append({
                    "id": entry.id,
                    "actor_id": entry.actor_id,
                    "actor_type": entry.actor_type,
                    "action": entry.action,
                    "target_type": entry.target_type,
                    "target_id": entry.target_id,
                    "metadata": entry.metadata_json,
                    "timestamp": entry.timestamp.isoformat(),
                    "hash_chain": entry.hash_chain
                })
            
            return results
            
        except Exception as e:
            raise Exception(f"Failed to get audit log: {str(e)}")
        finally:
            if should_close:
                db.close()
    
    def export_audit_log(
        self,
        start_date: datetime = None,
        end_date: datetime = None,
        format: str = "json",
        db: Session = None
    ) -> Dict[str, Any]:
        """Export audit log for compliance purposes"""
        
        if db is None:
            db = SessionLocal()
            should_close = True
        else:
            should_close = False
        
        try:
            # Get all audit entries in date range
            query = db.query(Audit)
            if start_date:
                query = query.filter(Audit.timestamp >= start_date)
            if end_date:
                query = query.filter(Audit.timestamp <= end_date)
            
            audit_entries = query.order_by(Audit.timestamp.asc()).all()
            
            # Format export data
            export_data = {
                "export_info": {
                    "exported_at": datetime.utcnow().isoformat(),
                    "start_date": start_date.isoformat() if start_date else None,
                    "end_date": end_date.isoformat() if end_date else None,
                    "total_entries": len(audit_entries),
                    "format": format
                },
                "audit_entries": []
            }
            
            for entry in audit_entries:
                export_data["audit_entries"].append({
                    "id": entry.id,
                    "actor_id": entry.actor_id,
                    "actor_type": entry.actor_type,
                    "action": entry.action,
                    "target_type": entry.target_type,
                    "target_id": entry.target_id,
                    "metadata": entry.metadata_json,
                    "timestamp": entry.timestamp.isoformat(),
                    "hash_chain": entry.hash_chain
                })
            
            # Generate export hash for integrity verification
            export_hash = self._generate_hash(
                json.dumps(export_data, sort_keys=True),
                audit_entries[-1].hash_chain if audit_entries else None
            )
            
            export_data["export_hash"] = export_hash
            
            return export_data
            
        except Exception as e:
            raise Exception(f"Failed to export audit log: {str(e)}")
        finally:
            if should_close:
                db.close()

# Global audit service instance
audit_service = AuditService()
