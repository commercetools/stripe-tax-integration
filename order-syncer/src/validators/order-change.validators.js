import CustomError from '../errors/custom.error.js';
import {
  HTTP_STATUS_SUCCESS_ACCEPTED,
  HTTP_STATUS_SUCCESS_NO_CONTENT,
} from '../constants/http.status.constants.js';
import {
  MESSAGE_TYPE,
  NOTIFICATION_TYPE_RESOURCE_CREATED,
} from '../constants/connectors.constants.js';

export function doValidation(messageBody) {
  if (!messageBody) {
    throw new CustomError(
      HTTP_STATUS_SUCCESS_ACCEPTED,
      `The incoming message body is missing. No further action is required. `
    );
  }

  // Make sure incoming message contains correct notification type
  if (NOTIFICATION_TYPE_RESOURCE_CREATED === messageBody.notificationType) {
    throw new CustomError(
      HTTP_STATUS_SUCCESS_NO_CONTENT,
      `Incoming message is about subscription resource creation. Skip handling the message`
    );
  }

  if (!MESSAGE_TYPE.includes(messageBody.type)) {
    throw new CustomError(
      HTTP_STATUS_SUCCESS_ACCEPTED,
      ` Message type ${messageBody.type} is incorrect.`
    );
  }

  // Make sure incoming message contains the identifier of the changed product
  const resourceTypeId = messageBody?.resource?.typeId;
  const resourceId = messageBody?.resource?.id;

  if (resourceTypeId !== 'order' && !resourceId) {
    throw new CustomError(
      HTTP_STATUS_SUCCESS_ACCEPTED,
      ` No order ID is found in message.`
    );
  }
}
