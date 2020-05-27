import express, { Response } from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import { isUndefined } from "util";
import axios, { AxiosResponse } from "axios";
import { TableStorageConfig } from './config/TableStorage';
import { StorageConnector } from './controller/StorageConnector';
import * as dotenv from "dotenv";
import * as path from "path";
import { Cache } from './controller/Cache';

// loading .env file
const ENV_FILE = path.join(__dirname, '.env');
dotenv.config({ path: ENV_FILE });

// web server port
const port = process.env.PORT || 3389;

const app = express();
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

//Table storage configuration
const dbConfig = new TableStorageConfig();

// Establishing Database connection
const dbResolver = new StorageConnector(dbConfig);

// Initializing Endpoint cache
const endpointCache = new Cache(dbResolver);

// rest endpoint for incoming bot messages
app.post('/api/messages', function (req, res) {

	// checking for the existence an Authorization header 
	if (isUndefined(req.headers.authorization)) {
		res.status(401).send();
	}

	// checking if the tenant id is included 
	if (req.body.channelData && req.body.channelData.tenant && req.body.channelData.tenant) {
		const tenantId = req.body.channelData.tenant;

		// loading endpoint mapping from cache, fallback from database
		endpointCache.resolveEndpointForTenant((error: Error, tenantId: string, endpointUrl?: string) => {

			if (error) {
				console.error(error);
				res.status(500).send();
			}

			if (isUndefined(endpointUrl)) {
				res.status(404).send();
			}

			// forwarding the request
			axios.post(endpointUrl, req.body, {

				// including the original Authorization header
				headers: { Authorization: req.headers.authorization }
			})
				.then(function (response) {

					// returning status code 200 if the request was successfull
					res.status(200).send();
				})
				.catch(function (error) {
					console.error(error);
					res.status(500).send();
				});

		}, tenantId);

	} else {
		res.status(400).send();
	}

});


// proxy api tab requests
app.all('/api/:tenantId/:forwardUrl*', function (req, res) {

	if (isUndefined(req.params.tenantId)) {
		res.status(400).send();
		return;
	}
	// looking up the defined service endpoint for the tenant
	if (isUndefined(req.params.forwardUrl)) {
		res.status(400).send();
		return;
	}
	endpointCache.resolveEndpointForTenant((error: Error, tenantId: string, endpointUrl?: string) => {
		let forwardUrl = tenantId + req.params.forwardUrl;
		if (req.params[0]) {
			forwardUrl += req.params[0];
		}
	
		// checking for the existence an Authorization header 
		// if (isUndefined(req.headers.authorization)) {
		// 	res.status(401).send();
		// 	return;
		// }
	
		// authorization header
		// let authorizationHeader = {
		// 	headers:
		// 	{
		// 		Authorization: req.headers.authorization
		// 	}
		// }
	
		switch (req.method) {
			case "GET": axios.get(forwardUrl)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			case "POST": axios.post(forwardUrl, req.body)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			case "PUT": axios.put(forwardUrl, req.body)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			case "PATCH": axios.patch(forwardUrl, req.body)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			case "DELETE": axios.delete(forwardUrl)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			case "HEAD": axios.head(forwardUrl)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			case "OPTIONS": axios.options(forwardUrl)
				.then(response => returnToRequestor(res, response))
				.catch(error => handleError(res, error));
				break;
			default:
				res.status(400).send();
		}
	},req.params.tenantId)

});

/**
 * Handler method to send the response of the target server back to Teams
 * @param originResponse Express response object
 * @param queryResponse Response of the target API
 */
function returnToRequestor(originResponse: Response, queryResponse: AxiosResponse) {
	originResponse.status(queryResponse.status).send(queryResponse);
}
/**
 * Handler method to deal with errors when forwarding the request
 * @param originResponse Express response object
 * @param error Axios error when request fails
 */
function handleError(originResponse: Response, error: any) {
	console.error(error);
	originResponse.status(500).send();
}

// starting the webserver
app.listen(port, () => console.info('Teams Proxy listening on port ' + port));