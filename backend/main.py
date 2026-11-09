import csv
import io

import boto3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta, timezone

from aws_client import (
    get_ec2_client,
    get_s3_client,
    get_rds_client,
    get_cloudwatch_client,
    get_iam_client,
    get_cost_explorer_client
)


# =====================================================
# 1. FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="CloudControl API",
    description="AWS Enterprise Infrastructure Management Platform",
    version="1.0.0"
)


# =====================================================
# 2. CORS CONFIGURATION
# =====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# =====================================================
# 3. HOME & HEALTH
# =====================================================

@app.get("/")
def home():
    return {
        "message": "Welcome to CloudControl API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CloudControl Backend"
    }


# =====================================================
# 4. EC2 INSTANCES
# =====================================================

@app.get("/ec2/instances")
def get_ec2_instances():

    try:
        ec2 = get_ec2_client()

        paginator = ec2.get_paginator("describe_instances")

        instances = []

        for page in paginator.paginate():

            for reservation in page["Reservations"]:

                for instance in reservation["Instances"]:

                    instance_name = next(
                        (
                            tag["Value"]
                            for tag in instance.get("Tags", [])
                            if tag["Key"] == "Name"
                        ),
                        "Unnamed Instance"
                    )

                    instances.append({
                        "instance_id": instance["InstanceId"],
                        "name": instance_name,
                        "instance_type": instance["InstanceType"],
                        "state": instance["State"]["Name"],
                        "availability_zone": instance["Placement"]["AvailabilityZone"],
                        "public_ip": instance.get("PublicIpAddress"),
                        "private_ip": instance.get("PrivateIpAddress")
                    })

        return {
            "total_instances": len(instances),
            "instances": instances
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 5. S3 BUCKETS
# =====================================================

@app.get("/s3/buckets")
def get_s3_buckets():

    try:
        s3 = get_s3_client()

        response = s3.list_buckets()

        buckets = []

        for bucket in response.get("Buckets", []):

            bucket_name = bucket["Name"]

            # REGION
            try:
                location = s3.get_bucket_location(
                    Bucket=bucket_name
                )

                region = (
                    location.get("LocationConstraint")
                    or "us-east-1"
                )

                if region == "EU":
                    region = "eu-west-1"

            except Exception:
                region = "Unavailable"

            # VERSIONING
            try:
                versioning_response = s3.get_bucket_versioning(
                    Bucket=bucket_name
                )

                versioning = versioning_response.get(
                    "Status", "Disabled"
                )

            except Exception:
                versioning = "Access denied"

            # ENCRYPTION
            encryption = "Unavailable"
            kms_key_id = None

            try:
                encryption_response = s3.get_bucket_encryption(
                    Bucket=bucket_name
                )

                rules = encryption_response.get(
                    "ServerSideEncryptionConfiguration", {}
                ).get("Rules", [])

                if rules:

                    encryption_config = rules[0].get(
                        "ApplyServerSideEncryptionByDefault", {}
                    )

                    encryption = encryption_config.get(
                        "SSEAlgorithm", "Unknown"
                    )

                    kms_key_id = encryption_config.get(
                        "KMSMasterKeyID"
                    )

                else:
                    encryption = "Not configured"

            except Exception as error:

                error_code = getattr(
                    error, "response", {}
                ).get("Error", {}).get("Code", "")

                if error_code == "ServerSideEncryptionConfigurationNotFoundError":
                    encryption = "Not configured"

                elif error_code in [
                    "AccessDenied",
                    "AccessDeniedException"
                ]:
                    encryption = "Access denied"

                else:
                    encryption = "Unavailable"

            buckets.append({
                "bucket_name": bucket_name,
                "creation_date": bucket["CreationDate"].isoformat(),
                "region": region,
                "versioning": versioning,
                "encryption": encryption,
                "kms_key_id": kms_key_id
            })

        return {
            "total_buckets": len(buckets),
            "buckets": buckets
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 6. NETWORKING - VPCS
# =====================================================

@app.get("/network/vpcs")
def get_vpcs():

    try:
        ec2 = get_ec2_client()

        paginator = ec2.get_paginator("describe_vpcs")

        vpcs = []

        for page in paginator.paginate():

            for vpc in page["Vpcs"]:

                vpcs.append({
                    "vpc_id": vpc["VpcId"],
                    "cidr_block": vpc["CidrBlock"],
                    "state": vpc["State"],
                    "is_default": vpc["IsDefault"],
                    "tags": vpc.get("Tags", [])
                })

        return {
            "total_vpcs": len(vpcs),
            "vpcs": vpcs
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 7. NETWORKING - SUBNETS
# =====================================================

@app.get("/network/subnets")
def get_subnets():

    try:
        ec2 = get_ec2_client()

        paginator = ec2.get_paginator("describe_subnets")

        subnets = []

        for page in paginator.paginate():

            for subnet in page["Subnets"]:

                subnets.append({
                    "subnet_id": subnet["SubnetId"],
                    "vpc_id": subnet["VpcId"],
                    "cidr_block": subnet["CidrBlock"],
                    "availability_zone": subnet["AvailabilityZone"],
                    "state": subnet["State"],
                    "available_ip_addresses": subnet["AvailableIpAddressCount"]
                })

        return {
            "total_subnets": len(subnets),
            "subnets": subnets
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 8. NETWORKING - SECURITY GROUPS
# =====================================================

@app.get("/network/security-groups")
def get_security_groups():

    try:
        ec2 = get_ec2_client()

        paginator = ec2.get_paginator("describe_security_groups")

        security_groups = []

        for page in paginator.paginate():

            for sg in page["SecurityGroups"]:

                security_groups.append({
                    "group_id": sg["GroupId"],
                    "group_name": sg["GroupName"],
                    "description": sg["Description"],
                    "vpc_id": sg.get("VpcId"),
                    "ingress_rules": len(sg.get("IpPermissions", [])),
                    "egress_rules": len(sg.get("IpPermissionsEgress", [])),
                    "tags": sg.get("Tags", [])
                })

        return {
            "total_security_groups": len(security_groups),
            "security_groups": security_groups
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 9. NETWORKING - INTERNET GATEWAYS
# =====================================================

@app.get("/network/internet-gateways")
def get_internet_gateways():

    try:
        ec2 = get_ec2_client()

        paginator = ec2.get_paginator("describe_internet_gateways")

        gateways = []

        for page in paginator.paginate():

            for gateway in page["InternetGateways"]:

                attachments = gateway.get("Attachments", [])

                gateways.append({
                    "internet_gateway_id": gateway["InternetGatewayId"],
                    "state": (
                        attachments[0]["State"]
                        if attachments else "detached"
                    ),
                    "vpc_id": (
                        attachments[0]["VpcId"]
                        if attachments else None
                    ),
                    "tags": gateway.get("Tags", [])
                })

        return {
            "total_internet_gateways": len(gateways),
            "internet_gateways": gateways
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 10. DATABASE - RDS
# =====================================================

@app.get("/database/instances")
def get_database_instances():

    try:
        rds = get_rds_client()

        paginator = rds.get_paginator("describe_db_instances")

        databases = []

        for page in paginator.paginate():

            for db in page["DBInstances"]:

                databases.append({
                    "db_instance_id": db["DBInstanceIdentifier"],
                    "engine": db["Engine"],
                    "engine_version": db["EngineVersion"],
                    "instance_class": db["DBInstanceClass"],
                    "status": db["DBInstanceStatus"],
                    "storage_gb": db["AllocatedStorage"],
                    "multi_az": db["MultiAZ"],
                    "endpoint": db.get("Endpoint", {}).get("Address")
                })

        return {
            "total_databases": len(databases),
            "databases": databases
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 11. MONITORING - CLOUDWATCH ALARMS
# =====================================================

@app.get("/monitoring/alarms")
def get_cloudwatch_alarms():

    try:
        cloudwatch = get_cloudwatch_client()

        paginator = cloudwatch.get_paginator("describe_alarms")

        alarms = []

        for page in paginator.paginate():

            for alarm in page["MetricAlarms"]:

                alarms.append({
                    "alarm_name": alarm["AlarmName"],
                    "metric_name": alarm["MetricName"],
                    "namespace": alarm["Namespace"],
                    "state": alarm["StateValue"],
                    "threshold": alarm["Threshold"],
                    "comparison": alarm["ComparisonOperator"]
                })

        return {
            "total_alarms": len(alarms),
            "alarms": alarms
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 12. MONITORING - EC2 CPU METRICS
# =====================================================

@app.get("/monitoring/ec2-cpu/{instance_id}")
def get_ec2_cpu_metrics(instance_id: str):

    try:
        cloudwatch = get_cloudwatch_client()

        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=3)

        response = cloudwatch.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[
                {
                    "Name": "InstanceId",
                    "Value": instance_id
                }
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=300,
            Statistics=["Average", "Maximum"]
        )

        datapoints = sorted(
            response["Datapoints"],
            key=lambda point: point["Timestamp"]
        )

        return {
            "instance_id": instance_id,
            "metric": "CPUUtilization",
            "unit": "Percent",
            "datapoints": [
                {
                    "timestamp": point["Timestamp"].isoformat(),
                    "average": point["Average"],
                    "maximum": point["Maximum"]
                }
                for point in datapoints
            ]
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 13. MONITORING - CLOUDWATCH LOG GROUPS
# =====================================================

@app.get("/monitoring/log-groups")
def get_log_groups():

    try:
        cloudwatch = get_cloudwatch_client()

        logs = boto3.client(
            "logs",
            region_name=cloudwatch.meta.region_name
        )

        paginator = logs.get_paginator("describe_log_groups")

        log_groups = []

        for page in paginator.paginate():

            for group in page.get("logGroups", []):

                log_groups.append({
                    "log_group_name": group["logGroupName"],
                    "creation_time": group.get("creationTime"),
                    "retention_in_days": group.get("retentionInDays"),
                    "stored_bytes": group.get("storedBytes", 0),
                    "kms_key_id": group.get("kmsKeyId")
                })

        return {
            "total_log_groups": len(log_groups),
            "log_groups": log_groups
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 14. SECURITY - IAM USERS & ROLES
# =====================================================

@app.get("/security/iam-summary")
def get_iam_summary():

    try:
        iam = get_iam_client()

        user_paginator = iam.get_paginator("list_users")
        role_paginator = iam.get_paginator("list_roles")

        users = []
        roles = []

        for page in user_paginator.paginate():

            for user in page["Users"]:

                users.append({
                    "username": user["UserName"],
                    "user_id": user["UserId"],
                    "arn": user["Arn"],
                    "created": user["CreateDate"].isoformat()
                })

        for page in role_paginator.paginate():

            for role in page["Roles"]:

                roles.append({
                    "role_name": role["RoleName"],
                    "role_id": role["RoleId"],
                    "arn": role["Arn"],
                    "created": role["CreateDate"].isoformat()
                })

        return {
            "total_users": len(users),
            "total_roles": len(roles),
            "users": users,
            "roles": roles
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 15. SECURITY - MFA AUDIT
# =====================================================

@app.get("/security/mfa-audit")
def get_mfa_audit():

    try:
        iam = get_iam_client()

        paginator = iam.get_paginator("list_users")

        users = []

        for page in paginator.paginate():

            for user in page["Users"]:

                username = user["UserName"]

                mfa_paginator = iam.get_paginator("list_mfa_devices")

                devices = []

                for mfa_page in mfa_paginator.paginate(
                    UserName=username
                ):
                    devices.extend(
                        mfa_page.get("MFADevices", [])
                    )

                users.append({
                    "username": username,
                    "user_id": user["UserId"],
                    "mfa_enabled": len(devices) > 0,
                    "mfa_devices": len(devices)
                })

        enabled = sum(
            1 for user in users if user["mfa_enabled"]
        )

        coverage = (
            round((enabled / len(users)) * 100, 2)
            if users else 0
        )

        return {
            "total_users": len(users),
            "users_with_mfa": enabled,
            "users_without_mfa": len(users) - enabled,
            "mfa_coverage_percentage": coverage,
            "users": users
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 16. SECURITY - ACCESS KEY AUDIT
# =====================================================

@app.get("/security/access-keys")
def get_access_key_audit():

    try:
        iam = get_iam_client()

        paginator = iam.get_paginator("list_users")

        keys = []

        current_time = datetime.now(timezone.utc)

        for page in paginator.paginate():

            for user in page["Users"]:

                username = user["UserName"]

                key_paginator = iam.get_paginator(
                    "list_access_keys"
                )

                for key_page in key_paginator.paginate(
                    UserName=username
                ):

                    for key in key_page.get(
                        "AccessKeyMetadata", []
                    ):

                        created = key["CreateDate"]

                        age_days = (
                            current_time - created
                        ).days

                        keys.append({
                            "username": username,
                            "access_key_id": key["AccessKeyId"],
                            "status": key["Status"],
                            "created": created.isoformat(),
                            "age_days": age_days,
                            "rotation_required": age_days > 90
                        })

        return {
            "total_access_keys": len(keys),
            "active_keys": sum(
                1 for key in keys
                if key["status"] == "Active"
            ),
            "inactive_keys": sum(
                1 for key in keys
                if key["status"] == "Inactive"
            ),
            "keys_older_than_90_days": sum(
                1 for key in keys
                if key["rotation_required"]
            ),
            "access_keys": keys
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 17. SECURITY - IAM CREDENTIAL REPORT
# =====================================================

@app.get("/security/credential-report")
def get_credential_report():

    try:
        iam = get_iam_client()

        try:
            iam.generate_credential_report()

        except Exception as error:

            error_code = getattr(
                error, "response", {}
            ).get("Error", {}).get("Code", "")

            if error_code != "ReportInProgressException":
                raise

        try:
            response = iam.get_credential_report()

        except Exception as error:

            error_code = getattr(
                error, "response", {}
            ).get("Error", {}).get("Code", "")

            if error_code in [
                "CredentialReportNotPresentException",
                "CredentialReportNotReadyException"
            ]:
                return {
                    "status": "PENDING",
                    "message": "Credential report is being generated."
                }

            raise

        report_content = response["Content"].decode("utf-8")

        reader = csv.DictReader(
            io.StringIO(report_content)
        )

        users = []

        for row in reader:

            if row["user"] == "<root_account>":
                continue

            users.append({
                "username": row["user"],
                "password_enabled": row["password_enabled"],
                "password_last_used": row["password_last_used"],
                "password_last_changed": row["password_last_changed"],
                "access_key_1_active": row["access_key_1_active"],
                "access_key_1_last_rotated": row["access_key_1_last_rotated"],
                "access_key_2_active": row["access_key_2_active"],
                "access_key_2_last_rotated": row["access_key_2_last_rotated"],
                "mfa_active": row["mfa_active"]
            })

        return {
            "status": "COMPLETE",
            "total_users": len(users),
            "users": users
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 18. SECURITY - IAM POLICY AUDIT
# =====================================================

@app.get("/security/policy-audit")
def get_policy_audit():

    try:
        iam = get_iam_client()

        findings = []
        policies_scanned = 0

        # -------------------------------------------------
        # COMMON POLICY DOCUMENT SCANNER
        # -------------------------------------------------

        def scan_document(
            document,
            identity_name,
            identity_type,
            policy_name,
            policy_arn=None
        ):

            statements = document.get("Statement", [])

            if isinstance(statements, dict):
                statements = [statements]

            for statement in statements:

                if statement.get("Effect") != "Allow":
                    continue

                actions = statement.get("Action", [])
                resources = statement.get("Resource", [])

                if isinstance(actions, str):
                    actions = [actions]

                if isinstance(resources, str):
                    resources = [resources]

                wildcard_action = (
                    "*" in actions
                    or any(
                        action.endswith(":*")
                        for action in actions
                        if isinstance(action, str)
                    )
                )

                wildcard_resource = "*" in resources

                if wildcard_action or wildcard_resource:

                    findings.append({
                        "identity_name": identity_name,
                        "identity_type": identity_type,
                        "policy_name": policy_name,
                        "policy_arn": policy_arn,
                        "wildcard_action": wildcard_action,
                        "wildcard_resource": wildcard_resource,
                        "severity": (
                            "HIGH"
                            if "*" in actions and "*" in resources
                            else "MEDIUM"
                        ),
                        "description": (
                            "Policy contains broad wildcard permissions."
                        )
                    })

        # -------------------------------------------------
        # MANAGED POLICY INSPECTOR
        # -------------------------------------------------

        def inspect_policy(
            policy,
            identity_name,
            identity_type
        ):

            nonlocal policies_scanned

            policy_arn = policy["PolicyArn"]

            # Get managed policy metadata.
            # AttachedPolicies does not contain DefaultVersionId.

            policy_details = iam.get_policy(
                PolicyArn=policy_arn
            )

            version_id = (
                policy_details["Policy"]["DefaultVersionId"]
            )

            # Retrieve the default policy version.

            policy_version = iam.get_policy_version(
                PolicyArn=policy_arn,
                VersionId=version_id
            )

            document = (
                policy_version["PolicyVersion"]["Document"]
            )

            policies_scanned += 1

            scan_document(
                document=document,
                identity_name=identity_name,
                identity_type=identity_type,
                policy_name=policy["PolicyName"],
                policy_arn=policy_arn
            )

        # =================================================
        # USER POLICIES
        # =================================================

        user_paginator = iam.get_paginator("list_users")

        for page in user_paginator.paginate():

            for user in page["Users"]:

                username = user["UserName"]

                # ATTACHED MANAGED POLICIES

                attached_paginator = iam.get_paginator(
                    "list_attached_user_policies"
                )

                for attached_page in attached_paginator.paginate(
                    UserName=username
                ):

                    for policy in attached_page["AttachedPolicies"]:

                        inspect_policy(
                            policy,
                            username,
                            "USER"
                        )

                # INLINE POLICIES

                inline_paginator = iam.get_paginator(
                    "list_user_policies"
                )

                for inline_page in inline_paginator.paginate(
                    UserName=username
                ):

                    for policy_name in inline_page["PolicyNames"]:

                        policy_response = iam.get_user_policy(
                            UserName=username,
                            PolicyName=policy_name
                        )

                        policies_scanned += 1

                        scan_document(
                            document=policy_response["PolicyDocument"],
                            identity_name=username,
                            identity_type="USER",
                            policy_name=policy_name
                        )

        # =================================================
        # ROLE POLICIES
        # =================================================

        role_paginator = iam.get_paginator("list_roles")

        for page in role_paginator.paginate():

            for role in page["Roles"]:

                role_name = role["RoleName"]

                # ATTACHED MANAGED POLICIES

                attached_paginator = iam.get_paginator(
                    "list_attached_role_policies"
                )

                for attached_page in attached_paginator.paginate(
                    RoleName=role_name
                ):

                    for policy in attached_page["AttachedPolicies"]:

                        inspect_policy(
                            policy,
                            role_name,
                            "ROLE"
                        )

                # INLINE POLICIES

                inline_paginator = iam.get_paginator(
                    "list_role_policies"
                )

                for inline_page in inline_paginator.paginate(
                    RoleName=role_name
                ):

                    for policy_name in inline_page["PolicyNames"]:

                        policy_response = iam.get_role_policy(
                            RoleName=role_name,
                            PolicyName=policy_name
                        )

                        policies_scanned += 1

                        scan_document(
                            document=policy_response["PolicyDocument"],
                            identity_name=role_name,
                            identity_type="ROLE",
                            policy_name=policy_name
                        )

        # =================================================
        # SUMMARY
        # =================================================

        return {
            "total_policies_scanned": policies_scanned,
            "total_findings": len(findings),
            "high_findings": sum(
                1 for item in findings
                if item["severity"] == "HIGH"
            ),
            "medium_findings": sum(
                1 for item in findings
                if item["severity"] == "MEDIUM"
            ),
            "findings": findings
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


# =====================================================
# 19. COST OPTIMIZATION - COST EXPLORER
# =====================================================

@app.get("/cost/summary")
def get_cost_summary():

    try:
        cost = get_cost_explorer_client()

        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=30)

        response = cost.get_cost_and_usage(
            TimePeriod={
                "Start": start_date.isoformat(),
                "End": end_date.isoformat()
            },
            Granularity="DAILY",
            Metrics=["UnblendedCost"],
            GroupBy=[
                {
                    "Type": "DIMENSION",
                    "Key": "SERVICE"
                }
            ]
        )

        return {
            "currency": "USD",
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "results": response["ResultsByTime"]
        }

    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))