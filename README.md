# tl;dr

Calling the same api gateway endpoint multiple times at the same time does not result in multiple lambda invokations at the same time, but their responses are returned to the cient sequentially.

# Setup

## One simple function as part of the api gateway

```javascript
const handler = async () => ({
    statusCode: 200,
    body: "Okay",
});

module.exports.handler = handler;
```

## One test function that calls the api in parallel

```javascript
const fetch = require("node-fetch");

const callFunc = () => fetch("http://localhost:4566/restapis/q4kyuj3qyp/prod/_user_request_/items");

const run = async () => {
    const timer = Date.now();
    await Promise.all([
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
    ]);
    console.log(Date.now() - timer);
}

run();
```

# Result

The test function always logs a number between 1000 and 1200. The more `callFunc()` I add to the test function the longer it takes for the test function to complete.

The lambda functions themselves finish extremely quickly. These are the logs from docker:

```
START RequestId: 0d40e0f7-ecf4-179e-3d04-c736eb227370 Version: $LATEST
END RequestId: 0d40e0f7-ecf4-179e-3d04-c736eb227370
REPORT RequestId: 0d40e0f7-ecf4-179e-3d04-c736eb227370	Duration: 6.03 ms	Billed Duration: 7 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 8c2b7956-abbd-1a3a-2735-2bb6a07d5aee Version: $LATEST
END RequestId: 8c2b7956-abbd-1a3a-2735-2bb6a07d5aee
REPORT RequestId: 8c2b7956-abbd-1a3a-2735-2bb6a07d5aee	Duration: 6.20 ms	Billed Duration: 7 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 8e4536c0-03fc-1567-ca08-c0592e25999d Version: $LATEST
END RequestId: 8e4536c0-03fc-1567-ca08-c0592e25999d
REPORT RequestId: 8e4536c0-03fc-1567-ca08-c0592e25999d	Duration: 6.07 ms	Billed Duration: 7 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 2875c0ed-b112-1b60-ad1b-381525358ac4 Version: $LATEST
END RequestId: 2875c0ed-b112-1b60-ad1b-381525358ac4
REPORT RequestId: 2875c0ed-b112-1b60-ad1b-381525358ac4	Duration: 6.41 ms	Billed Duration: 7 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 44b3551c-9fc8-1851-5db7-605faf3cd8f0 Version: $LATEST
END RequestId: 44b3551c-9fc8-1851-5db7-605faf3cd8f0
REPORT RequestId: 44b3551c-9fc8-1851-5db7-605faf3cd8f0	Duration: 5.81 ms	Billed Duration: 6 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: a807dc0d-c4b7-12ae-334a-bb80a491a3ba Version: $LATEST
END RequestId: a807dc0d-c4b7-12ae-334a-bb80a491a3ba
REPORT RequestId: a807dc0d-c4b7-12ae-334a-bb80a491a3ba	Duration: 5.49 ms	Billed Duration: 6 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 4d78c873-e379-1343-9c4f-8d4fcc988d9f Version: $LATEST
END RequestId: 4d78c873-e379-1343-9c4f-8d4fcc988d9f
REPORT RequestId: 4d78c873-e379-1343-9c4f-8d4fcc988d9f	Duration: 5.93 ms	Billed Duration: 6 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 0b04c933-b68a-19f0-8361-d671da1b1c10 Version: $LATEST
END RequestId: 0b04c933-b68a-19f0-8361-d671da1b1c10
REPORT RequestId: 0b04c933-b68a-19f0-8361-d671da1b1c10	Duration: 5.34 ms	Billed Duration: 6 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: 64a6bffc-6c76-1ca1-016c-1abdd32bfbbb Version: $LATEST
END RequestId: 64a6bffc-6c76-1ca1-016c-1abdd32bfbbb
REPORT RequestId: 64a6bffc-6c76-1ca1-016c-1abdd32bfbbb	Duration: 5.59 ms	Billed Duration: 6 ms	Memory Size: 1536 MB	Max Memory Used: 47 MB	
START RequestId: cb18a3ae-36c7-18f9-5aae-d141bfdcdd23 Version: $LATEST
END RequestId: cb18a3ae-36c7-18f9-5aae-d141bfdcdd23
REPORT RequestId: cb18a3ae-36c7-18f9-5aae-d141bfdcdd23	Duration: 6.00 ms	Billed Duration: 7 ms	Memory Size: 1536 MB	Max Memory Used: 48 MB	
```

And these are the localstack logs that are prompted while running the test function:

```
localstack_main | 2022-09-26T19:37:12.323 DEBUG --- [  Thread-634] l.s.a.lambda_executors     : Checking if there are idle containers ...
localstack_main | 2022-09-26T19:37:13.771  INFO --- [   asgi_gw_3] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.772 DEBUG --- [   asgi_gw_3] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.773  INFO --- [   asgi_gw_3] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.773 DEBUG --- [   asgi_gw_3] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:13.778  INFO --- [  asgi_gw_38] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.778 DEBUG --- [  asgi_gw_38] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.780  INFO --- [  asgi_gw_19] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.781 DEBUG --- [  asgi_gw_19] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.782  INFO --- [  asgi_gw_23] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.782 DEBUG --- [  asgi_gw_23] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.783  INFO --- [   asgi_gw_4] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.784  INFO --- [  asgi_gw_36] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.785 DEBUG --- [   asgi_gw_4] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.785  INFO --- [  asgi_gw_46] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.789 DEBUG --- [  asgi_gw_46] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.787  INFO --- [  asgi_gw_22] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.788  INFO --- [  asgi_gw_44] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.790 DEBUG --- [  asgi_gw_44] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.786  INFO --- [  asgi_gw_17] l.s.apigateway.integration : Method request body before transformations:
localstack_main | 2022-09-26T19:37:13.789 DEBUG --- [   asgi_gw_3] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.790 DEBUG --- [  asgi_gw_22] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.788 DEBUG --- [  asgi_gw_36] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.791 DEBUG --- [  asgi_gw_17] l.s.awslambda.lambda_api   : Running Lambda function arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e from API Gateway invocation: GET /items
localstack_main | 2022-09-26T19:37:13.796 DEBUG --- [   asgi_gw_3] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.801 DEBUG --- [   asgi_gw_3] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:13.805 DEBUG --- [   asgi_gw_3] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:13.815 DEBUG --- [   asgi_gw_3] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:13.825 DEBUG --- [   asgi_gw_3] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:13.844  INFO --- [  asgi_gw_38] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.845 DEBUG --- [  asgi_gw_38] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:13.855 DEBUG --- [  asgi_gw_38] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.863  INFO --- [   asgi_gw_3] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:13.866 DEBUG --- [  asgi_gw_38] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.873 DEBUG --- [  asgi_gw_38] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:13.878 DEBUG --- [  asgi_gw_38] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:13.884 DEBUG --- [  asgi_gw_38] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:13.894 DEBUG --- [  asgi_gw_38] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:13.912  INFO --- [  asgi_gw_19] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.913 DEBUG --- [  asgi_gw_19] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:13.922 DEBUG --- [  asgi_gw_19] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.930 DEBUG --- [  asgi_gw_19] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.937  INFO --- [  asgi_gw_38] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:13.940 DEBUG --- [  asgi_gw_19] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:13.945 DEBUG --- [  asgi_gw_19] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:13.952 DEBUG --- [  asgi_gw_19] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:13.961 DEBUG --- [  asgi_gw_19] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:13.981  INFO --- [  asgi_gw_23] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.981 DEBUG --- [  asgi_gw_23] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:13.989 DEBUG --- [  asgi_gw_23] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:13.997 DEBUG --- [  asgi_gw_23] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.004  INFO --- [  asgi_gw_19] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.007 DEBUG --- [  asgi_gw_23] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.013 DEBUG --- [  asgi_gw_23] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.019 DEBUG --- [  asgi_gw_23] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.028 DEBUG --- [  asgi_gw_23] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.047  INFO --- [   asgi_gw_4] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.048 DEBUG --- [   asgi_gw_4] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:14.059 DEBUG --- [   asgi_gw_4] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.067  INFO --- [  asgi_gw_23] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.069 DEBUG --- [   asgi_gw_4] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.080 DEBUG --- [   asgi_gw_4] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.087 DEBUG --- [   asgi_gw_4] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.094 DEBUG --- [   asgi_gw_4] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.107 DEBUG --- [   asgi_gw_4] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.168  INFO --- [  asgi_gw_46] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.168 DEBUG --- [  asgi_gw_46] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:14.175 DEBUG --- [  asgi_gw_46] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.179  INFO --- [   asgi_gw_4] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.182 DEBUG --- [  asgi_gw_46] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.190 DEBUG --- [  asgi_gw_46] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.196 DEBUG --- [  asgi_gw_46] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.202 DEBUG --- [  asgi_gw_46] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.212 DEBUG --- [  asgi_gw_46] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.273  INFO --- [  asgi_gw_44] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.274 DEBUG --- [  asgi_gw_44] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:14.282 DEBUG --- [  asgi_gw_44] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.287  INFO --- [  asgi_gw_46] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.289 DEBUG --- [  asgi_gw_44] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.295 DEBUG --- [  asgi_gw_44] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.300 DEBUG --- [  asgi_gw_44] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.306 DEBUG --- [  asgi_gw_44] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.316 DEBUG --- [  asgi_gw_44] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.376  INFO --- [  asgi_gw_22] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.376 DEBUG --- [  asgi_gw_22] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:14.382 DEBUG --- [  asgi_gw_22] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.389 DEBUG --- [  asgi_gw_22] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.394 DEBUG --- [  asgi_gw_22] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.399 DEBUG --- [  asgi_gw_22] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.404 DEBUG --- [  asgi_gw_22] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.412 DEBUG --- [  asgi_gw_22] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.433  INFO --- [  asgi_gw_44] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.469  INFO --- [  asgi_gw_36] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.469 DEBUG --- [  asgi_gw_36] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:14.474 DEBUG --- [  asgi_gw_36] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.480 DEBUG --- [  asgi_gw_36] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.486 DEBUG --- [  asgi_gw_36] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.490 DEBUG --- [  asgi_gw_36] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.496 DEBUG --- [  asgi_gw_36] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.504 DEBUG --- [  asgi_gw_36] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.525  INFO --- [  asgi_gw_22] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.565  INFO --- [  asgi_gw_17] l.s.a.lambda_executors     : Running lambda: arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.566 DEBUG --- [  asgi_gw_17] l.s.a.lambda_executors     : Priming docker container with runtime "nodejs14.x" and arn "arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e".
localstack_main | 2022-09-26T19:37:14.574 DEBUG --- [  asgi_gw_17] l.s.a.lambda_executors     : Priming Docker container (status "1"): localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.582 DEBUG --- [  asgi_gw_17] l.u.c.container_client     : Getting networks for container: localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e
localstack_main | 2022-09-26T19:37:14.588 DEBUG --- [  asgi_gw_17] l.u.c.container_client     : Getting the entrypoint for image: mlupin/docker-lambda:nodejs14.x
localstack_main | 2022-09-26T19:37:14.593 DEBUG --- [  asgi_gw_17] l.s.a.lambda_executors     : Using entrypoint "/var/rapid/init --bootstrap /var/runtime/bootstrap --enable-msg-logs" for container "localstack_main_lambda_arn_aws_lambda_eu-central-1_000000000000_function_localstack-test-MyFunction-06f0e74e" on network "localstack-test_default".
localstack_main | 2022-09-26T19:37:14.599 DEBUG --- [  asgi_gw_17] l.s.a.lambda_executors     : Calling http://172.20.0.3:9001 to run invocation in docker-reuse Lambda container
localstack_main | 2022-09-26T19:37:14.608 DEBUG --- [  asgi_gw_17] l.s.a.lambda_executors     : Lambda arn:aws:lambda:eu-central-1:000000000000:function:localstack-test-MyFunction-06f0e74e result / log output:
localstack_main | {"statusCode":200,"body":"Okay"}
localstack_main | >
localstack_main | 2022-09-26T19:37:14.628  INFO --- [  asgi_gw_36] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
localstack_main | 2022-09-26T19:37:14.712  INFO --- [  asgi_gw_17] localstack.request.http    : GET /restapis/q4kyuj3qyp/prod/_user_request_/items => 200
```

As you can see all 10 api calls are logged almost instantly, but their responses are returned to the client only one-by-one and not at the same time.

# Expected result

I would expect that calling api gateway 10 times at the same time is as quickly as calling the same end point just once, because the lambda function is not called sequentially, but in parallel