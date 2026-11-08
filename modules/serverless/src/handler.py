import json


def lambda_handler(event, context):

    action = event.get("action", "default")

    if action == "health":
        response = {
            "status": "healthy",
            "service": "AWS Enterprise Platform"
        }

    elif action == "info":
        response = {
            "platform": "AWS Enterprise Infrastructure",
            "managed_by": "Terraform"
        }

    else:
        response = {
            "message": "Unknown action"
        }

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(response)
    }