// Carregue a biblioteca AWS
var AWS = require('aws-sdk');

exports.handler = function (event, context, callback) {
  // Verifique se o evento é uma mensagem SNS
  if (event.Records[0].EventSource === 'aws:sns') {
    // Obtenha a mensagem da notificação SNS
    var message = event.Records[0].Sns.Message;
    var idMessage = event.Records[0].Sns.MessageId;
    console.log(message)

    const dynamodb = new AWS.DynamoDB.DocumentClient();

    // Define os parâmetros para a operação de inserção de item
    const params = {
      TableName: "lambda-sns-signature",
      Item: {
        id: idMessage,
        message: message
      }
    };

    // Insere o registro na tabela
    dynamodb.put(params, (error) => {
      if (error) {
        console.error(error);
        return;
      }
    });
  }
};
