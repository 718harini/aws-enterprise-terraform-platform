output "vpc_id" { value = aws_vpc.this.id }
output "public_subnet_ids" { value = [for subnet in aws_subnet.public : subnet.id] }
output "web_security_group_id" { value = aws_security_group.web.id }
