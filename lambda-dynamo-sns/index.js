const AWS = require("aws-sdk");

exports.handler = function (event, context, callback) {

  console.log(event);
  // determina o nome do tópico
  const topicName = "topico-dynamo-sns-create";

  // Cria uma conexão com o DynamoDB
  const dynamodb = new AWS.DynamoDB.DocumentClient({ region: "us-east-1" });

  // Obtenha o corpo da solicitação
  var body = event;

  console.log("body");
  console.log(event.body)

  // Define os parâmetros para a operação de inserção de item
  const params = {
    TableName: "lambda-sns-dynamo",
    Item: body,
  };


  // Insere o registro na tabela
  dynamodb.put(params, (error) => {
    if (error) {
      console.log("Deu Erro")
      console.log(error)
      return;
    }

    // Cria uma conexão com o SNS
    const sns = new AWS.SNS();

    // Define os parâmetros para a operação de criação de tópico
    const params = {
      Name: topicName,
    };

    // Cria o tópico SNS
    sns.createTopic(params, (error, data) => {
      if (error) {
        console.error(error);
        return;
      }

      // Obtém o Amazon Resource Name (ARN) do tópico
      const topicArn = data.TopicArn;

      // Envia uma mensagem para o tópico SNS informando que o registro foi criado no DynamoDB
      const params = {
        Message: `O registro ${body.id} foi inserido no Dynamo`,
        Subject: "Novo registro no DynamoDB",
        TopicArn: topicArn,
      };


      // Publica o tópico
      sns.publish(params, (error) => {
        if (error) {
          console.log(error)
          console.error(error);
          return;
        }
      });


      // Defina o ID do tópico e a URL de retorno
      var endpoint = 'arn:aws:lambda:us-east-1:567374489415:function:lambda-sns-signature';

      // Crie a assinatura
      var paramsSubscribe = {
        Protocol: 'LAMBDA',
        TopicArn: topicArn,
        Endpoint: endpoint
      };


      sns.subscribe(paramsSubscribe, function (err, data) {
        if (err) {
          console.log("Deu erro na assinatura");
          console.log(err);
          console.log(err, err.stack);
        } else {
          console.log("Fez a assinatura");
          console.log(data);
          // Envie uma resposta de sucesso para o cliente
          callback(null, {
            statusCode: 200,
            body: `Informação adiconada no Dynamo e assinada no tópico! \n 
              Assinatura ID: ${data.ResponseMetadata.RequestId} \n
              ARN Tópico: ${data.SubscriptionArn}\n`
          });
        }
      });
    });
  });

}


