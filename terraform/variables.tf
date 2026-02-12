variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-2"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "vulnsentinel"
}

variable "domain" {
  description = "Domain for the website"
  type        = string
  default     = "vulnsentinel.nfroze.co.uk"
}

variable "nvd_api_key" {
  description = "NVD API key (optional, increases rate limit)"
  type        = string
  default     = ""
  sensitive   = true
}
