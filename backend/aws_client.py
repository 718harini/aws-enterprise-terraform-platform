import boto3

AWS_REGION = "us-east-1"


def get_ec2_client():
    return boto3.client("ec2", region_name=AWS_REGION)


def get_s3_client():
    return boto3.client("s3", region_name=AWS_REGION)


def get_rds_client():
    return boto3.client("rds", region_name=AWS_REGION)


def get_cloudwatch_client():
    return boto3.client("cloudwatch", region_name=AWS_REGION)


def get_iam_client():
    return boto3.client("iam")


def get_cost_explorer_client():
    return boto3.client("ce", region_name=AWS_REGION)