import { logger } from '../utils/logger.util.js';
import { doValidation } from '../validators/order-change.validators.js';
import { decodeToJson } from '../utils/decoder.util.js';
import { getCartByOrderId } from '../clients/query.client.js';
import { updateOrderTaxTxn } from '../clients/update.client.js';
import {
  HTTP_STATUS_SUCCESS_NO_CONTENT,
  HTTP_STATUS_SERVER_ERROR,
  HTTP_STATUS_SUCCESS_ACCEPTED,
} from '../constants/http.status.constants.js';
import createTaxTransaction from '../extensions/stripe/clients/client.js';
import CustomError from '../errors/custom.error.js';

async function syncToTaxProvider(orderId, cart) {
  const createTaxTxnResponse = await createTaxTransaction(orderId, cart).catch(
    (error) => {
      throw new CustomError(
        HTTP_STATUS_SUCCESS_ACCEPTED,
        `Error from extension : ${error.message}`,
        error
      );
    }
  );

  const taxTxnId = createTaxTxnResponse.id;
  logger.info(
    `Tax transaction ID from Stripe of order ${orderId} : ${taxTxnId}`
  );

  if (taxTxnId) {
    await updateOrderTaxTxn(taxTxnId, orderId);
  }
}

export const syncHandler = async (request, response) => {
  try {
    // Receive the Pub/Sub message
    const encodedMessageBody = request.body?.message?.data;
    if (!encodedMessageBody) {
      throw new CustomError(
        HTTP_STATUS_SUCCESS_ACCEPTED,
        'Missing message data from incoming event message.'
      );
    }

    const messageBody = decodeToJson(encodedMessageBody);
    doValidation(messageBody);

    const orderId = messageBody?.resource?.id;
    const cart = await getCartByOrderId(orderId);
    if (cart) {
      await syncToTaxProvider(orderId, cart);
    }
  } catch (err) {
    logger.error(err);
    if (err.statusCode) return response.status(err.statusCode).send(err);
    return response.status(HTTP_STATUS_SERVER_ERROR).send(err);
  }

  // Return the response for the client
  return response.status(HTTP_STATUS_SUCCESS_NO_CONTENT).send();
};
