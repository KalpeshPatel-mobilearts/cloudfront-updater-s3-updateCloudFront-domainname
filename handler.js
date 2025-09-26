'use strict';
var AWS = require("aws-sdk");
var cloudfront = new AWS.CloudFront();
var route53 = new AWS.Route53();

const newDistConfig = {
  "Id": "E10U4NXRG4DMCE",
  "ARN": "arn:aws:cloudfront::059256371462:distribution/E10U4NXRG4DMCE",
  "Status": "Deployed",
  "LastModifiedTime": "2025-09-24T10:39:19.600Z",
  "InProgressInvalidationBatches": 0,
  "DomainName": "d2wzodp0pqlaxg.cloudfront.net",
  "ActiveTrustedSigners": {
    "Enabled": false,
    "Quantity": 0,
    "Items": []
  },
  "ActiveTrustedKeyGroups": {
    "Enabled": false,
    "Quantity": 0,
    "Items": []
  },
  "DistributionConfig": {
    "CallerReference": "4f8c7de9-d18c-4e9e-ad09-1c8c77c4e1f4",
    "Aliases": {
      "Quantity": 1,
      "Items": [
        "streamalways.com"
      ]
    },
    "DefaultRootObject": "emptypage.html",
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "mobilesubscription.s3.eu-central-1.amazonaws.com",
          "DomainName": "mobilesubscription.s3.eu-central-1.amazonaws.com",
          "OriginPath": "",
          "CustomHeaders": {
            "Quantity": 0,
            "Items": []
          },
          "S3OriginConfig": {
            "OriginAccessIdentity": ""
          },
          "ConnectionAttempts": 3,
          "ConnectionTimeout": 10,
          "OriginShield": {
            "Enabled": false
          },
          "OriginAccessControlId": ""
        }
      ]
    },
    "OriginGroups": {
      "Quantity": 0,
      "Items": []
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "mobilesubscription.s3.eu-central-1.amazonaws.com",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0,
        "Items": []
      },
      "TrustedKeyGroups": {
        "Enabled": false,
        "Quantity": 0,
        "Items": []
      },
      "ViewerProtocolPolicy": "allow-all",
      "AllowedMethods": {
        "Quantity": 2,
        "Items": [
          "HEAD",
          "GET"
        ],
        "CachedMethods": {
          "Quantity": 2,
          "Items": [
            "HEAD",
            "GET"
          ]
        }
      },
      "SmoothStreaming": false,
      "Compress": true,
      "LambdaFunctionAssociations": {
        "Quantity": 0,
        "Items": []
      },
      "FunctionAssociations": {
        "Quantity": 0,
        "Items": []
      },
      "FieldLevelEncryptionId": "",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6"
    },
    "CacheBehaviors": {
      "Quantity": 0,
      "Items": []
    },
    "CustomErrorResponses": {
      "Quantity": 0,
      "Items": []
    },
    "Comment": "",
    "Logging": {
      "Enabled": false,
      "IncludeCookies": false,
      "Bucket": "",
      "Prefix": ""
    },
    "PriceClass": "PriceClass_All",
    "Enabled": true,
    "ViewerCertificate": {
      "CloudFrontDefaultCertificate": false,
      "ACMCertificateArn": "arn:aws:acm:us-east-1:059256371462:certificate/7f6548d5-d926-4be9-b4d6-f8d0219da265",
      "SSLSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021",
      "Certificate": "arn:aws:acm:us-east-1:059256371462:certificate/7f6548d5-d926-4be9-b4d6-f8d0219da265",
      "CertificateSource": "acm"
    },
    "Restrictions": {
      "GeoRestriction": {
        "RestrictionType": "none",
        "Quantity": 0,
        "Items": []
      }
    },
    "WebACLId": "",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true,
    "ContinuousDeploymentPolicyId": "",
    "Staging": false
  },
  "AliasICPRecordals": [
    {
      "CNAME": "streamalways.com",
      "ICPRecordalStatus": "APPROVED"
    }
  ]
};

// first commit
// Function to find CloudFront distribution by domain name via Route53
async function findDistributionByDomain(domainName) {
    try {
        console.log(`Finding hosted zone for domain: ${domainName}`);
        
        // Get hosted zone ID from domain
        const hostedZoneId = await getHostedZoneId(domainName);
        console.log("Retrieved Hosted Zone ID:", hostedZoneId);
        
        // Get CloudFront distribution from Route53 records
        const distributionDomain = await getCloudFrontFromRoute53(hostedZoneId, domainName);
        console.log("Found CloudFront domain:", distributionDomain);
        
        // Extract distribution ID from CloudFront domain
        const distributionId = await getDistributionIdFromDomain(distributionDomain);
        console.log("Found distribution ID:", distributionId);
        
        return distributionId;
    } catch (error) {
        throw error;
    }
}

// Function to retrieve hosted zone ID from subdomain
const getHostedZoneId = async (subdomain) => {
    try {
        const params = {
          DNSName: subdomain
        };
    
        const data = await route53.listHostedZonesByName(params).promise();
    
        if (data.HostedZones && data.HostedZones.length > 0) {
          return data.HostedZones[0].Id.split('/').pop();
        } else {
          throw new Error("No hosted zone found for the specified domain name");
        }
      } catch (error) {
        console.error("Error retrieving hosted zone ID:", error);
        throw error;
      }
};

// Function to get CloudFront distribution from Route53 records
const getCloudFrontFromRoute53 = async (hostedZoneId, domainName) => {
    try {
        const params = {
            HostedZoneId: hostedZoneId
        };
        
        const data = await route53.listResourceRecordSets(params).promise();
        
        // Find A record with alias pointing to CloudFront
        for (const record of data.ResourceRecordSets) {
            if (record.Name === `${domainName}.` && record.Type === 'A' && record.AliasTarget) {
                if (record.AliasTarget.DNSName.includes('cloudfront.net')) {
                    return record.AliasTarget.DNSName;
                }
            }
        }
        
        throw new Error(`No CloudFront alias found for domain: ${domainName}`);
    } catch (error) {
        console.error("Error getting CloudFront from Route53:", error);
        throw error;
    }
};

// Function to get distribution ID from CloudFront domain
const getDistributionIdFromDomain = async (cloudfrontDomain) => {
    try {
        // Clean the domain name (remove trailing dot)
        const cleanDomain = cloudfrontDomain.replace(/\.$/, '');
        console.log(`Looking for distribution with domain: ${cleanDomain}`);
        
        // Get all distributions with pagination
        let allDistributions = [];
        let marker = null;
        
        do {
            const params = marker ? { Marker: marker } : {};
            const distributions = await cloudfront.listDistributions(params).promise();
            
            allDistributions = allDistributions.concat(distributions.DistributionList.Items);
            
            // Check if there are more results
            if (distributions.DistributionList.IsTruncated) {
                marker = distributions.DistributionList.NextMarker;
            } else {
                marker = null;
            }
        } while (marker);
        
        console.log(`Found ${allDistributions.length} total distributions`);
        
        for (const dist of allDistributions) {
            console.log(`Checking distribution ${dist.Id} with domain: ${dist.DomainName}`);
            
            // Match the CloudFront domain name
            if (dist.DomainName === cleanDomain) {
                console.log(`Found matching distribution: ${dist.Id}`);
                return dist.Id;
            }
        }
        
        // If no exact match, try to find by extracting ID from domain
        const domainParts = cleanDomain.split('.');
        if (domainParts.length >= 3 && domainParts[1] === 'cloudfront' && domainParts[2] === 'net') {
            const possibleId = domainParts[0];
            console.log(`Trying to find distribution with ID pattern: ${possibleId}`);
            
            for (const dist of allDistributions) {
                if (dist.DomainName.startsWith(possibleId)) {
                    console.log(`Found distribution by ID pattern: ${dist.Id}`);
                    return dist.Id;
                }
            }
        }
        
        throw new Error(`No distribution found for CloudFront domain: ${cloudfrontDomain}`);
    } catch (error) {
        console.error("Error getting distribution ID:", error);
        throw error;
    }
};

module.exports.updateDistributionByDomain = async (event) => {
    try {
        // Get domain name from event
        var domainName = event.domainName;
        
        if (!domainName) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: 'domainName is required',
                    message: 'Please provide domainName in the event payload'
                })
            };
        }

        console.log(`Finding CloudFront distribution for domain: ${domainName}`);
        
        // Find distribution ID by domain name
        var distID = await findDistributionByDomain(domainName);
        console.log(`Found distribution ID: ${distID}`);

        var params2 = {
            Id: distID
        };

        var res = await cloudfront.getDistribution(params2).promise();
        const distributionConfig = res.Distribution.DistributionConfig;

        // Update with new configuration
        distributionConfig.Origins = newDistConfig.DistributionConfig.Origins;
        distributionConfig.CacheBehaviors = newDistConfig.DistributionConfig.CacheBehaviors;
        distributionConfig.DefaultCacheBehavior = newDistConfig.DistributionConfig.DefaultCacheBehavior;
        distributionConfig.DefaultRootObject = newDistConfig.DistributionConfig.DefaultRootObject;
        
        console.log(JSON.stringify(distributionConfig));
        
        var params3 = {
            DistributionConfig: distributionConfig,
            Id: distID,
            IfMatch: res.ETag
        };

        var res3 = await cloudfront.updateDistribution(params3).promise();
        console.log(res3);

        // Create invalidation for all paths
        var invalidationParams = {
            DistributionId: distID,
            InvalidationBatch: {
                Paths: {
                    Quantity: 1,
                    Items: ['/*']
                },
                CallerReference: Date.now().toString()
            }
        };

        var invalidationResult = await cloudfront.createInvalidation(invalidationParams).promise();
        console.log('Invalidation created:', invalidationResult);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'CloudFront distribution updated and invalidated successfully',
                domainName: domainName,
                distributionId: distID,
                status: res3.Distribution.Status,
                invalidationId: invalidationResult.Invalidation.Id
            })
        };

    } catch (error) {
        console.error('Error updating CloudFront:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to update CloudFront distribution',
                details: error.message
            })
        };
    }
};
