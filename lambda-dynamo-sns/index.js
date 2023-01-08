const AWS = require('aws-sdk');
exports.handler = (event, context, callback) => {

  if (!event || !event.id || !event.message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields: id and message' }),
    };
  }
  // cria um objeto do tipo DocumentClient, que é um cliente especializado
  // para trabalhar com o DynamoDB
  const docClient = new AWS.DynamoDB.DocumentClient();

  // define os parâmetros para a operação de salvar os dados
  const params = {
    TableName: 'lambda-sns-dynamo', // nome da tabela
    Item: {
      id: event.id, // ID do item a ser salvo
      message: event.message, // mensagem a ser salva
    },
  };

  // tenta salvar os dados no DynamoDB
  try {
    const result = docClient.put(params).promise();
    if (!result) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error saving data to DynamoDB' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error saving data to DynamoDB' }),
    };
  }

  // Cria uma conexão com o SNS
  const sns = new AWS.SNS();
  // determina o nome do tópico
  const topicName = "topico-dynamo-sns-create";

  // Define os parâmetros para a operação de criação de tópico
  const paramsTopic = {
    Name: topicName,
  };

  // Cria o tópico SNS
  try {
    sns.createTopic(paramsTopic, (error, data) => {
      if (error) {
        console.error(error);
        return;
      }
      // Obtém o Amazon Resource Name (ARN) do tópico
      topicArn = data.TopicArn;
    });

    // Publica mensagem
    // Envia uma mensagem para o tópico SNS informando que o registro foi criado no DynamoDB
    const paramsMessage = {
      Message: `A mensagem ${event.message} foi inserida no Dynamo 
        tabela: lambda-sns-dynamo id: ${event.id}`,
      Subject: "Novo registro no DynamoDB",
      TopicArn: topicArn,
    };

    // Publica o tópico
    try {
      sns.publish(paramsMessage, (error) => {
        if (error) {
          console.log(error)
          console.error(error);
          return;
        }
      });
    }
    catch(error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error a publish Topic SNS' }),
      };
    }

    // Assina o tópico
    // Defina o ID do tópico e a URL de retorno
    var endpoint = 'arn:aws:lambda:us-east-1:567374489415:function:lambda-sns-signature';

    // Crie a assinatura
    var paramsSubscribe = {
      Protocol: 'LAMBDA',
      TopicArn: topicArn,
      Endpoint: endpoint
    };

    try {
      sns.subscribe(paramsSubscribe, function (error, data) {
        if (error) {
          console.log("Deu erro na assinatura");
          console.log(error);
          console.log(error, error.stack);
        } else {
          console.log("Fez a assinatura");
          console.log(data);
          // Envie uma resposta de sucesso para o cliente
          callback(null, {
            statusCode: 200,
            body: `Sua mensagem foi adicionada no Dynamo, Publicada no Tópico e Assinada ID de Assinatura:  \n 
              ${data.ResponseMetadata.RequestId}`
          });
        }
      });
    }
    catch(error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error a subscribe Topic SNS' }),
      };
    }

  }
  catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error create Topic SNS' }),
    };
  }
} // end handle
