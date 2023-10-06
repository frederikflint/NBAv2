import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

async function updatePredictions(username, western, eastern) {
  const datetime = new Date().toISOString().split("T").join(" ").split(".")[0];

  const response = await client.send(
    new PutItemCommand({
      TableName: "nba-predictions",
      Item: {
        username: { S: username },
        datetime: { S: datetime },
        eastern: { M: marshall(eastern) },
        western: { M: marshall(western) },
      },
    })
  );

  return response;
}

export const handler = async (event, context, callback) => {
  try {
    if (event.body) {
      const payload = JSON.parse(event.body);

      if (payload.username && payload.western && payload.eastern) {
        const data = await updatePredictions(
          payload.username,
          payload.western,
          payload.eastern
        );
        const response = {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data, event }),
        };

        callback(null, response);
      }
    }
  } catch (error) {
    console.log(error);
    const response = {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(error),
    };

    callback(null, response);
  }
};
