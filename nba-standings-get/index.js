import { DynamoDBClient, QueryCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

async function getPredictions(date) {
  const rawData = await client.send(
    new QueryCommand({
      TableName: "nba-standings",
      KeyConditionExpression: "#date = :date",
      ExpressionAttributeNames: {
        "#date": "date",
      },
      ExpressionAttributeValues: {
        ":date": {
          S: date,
        },
      },
    })
  );

  if (rawData.Items.length) {
    const data = unmarshall(rawData.Items?.[0]);

    return data;
  }

  return {};
}

export const handler = async (event, context, callback) => {
  try {
    let dateString = "";
    if (event?.queryStringParameters?.date) {
      dateString = event?.queryStringParameters?.date;
    } else {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed, so we add 1
      const year = today.getFullYear();

      dateString = `${day}/${month}/${year}`;
    }

    const data = await getPredictions(dateString);

    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    callback(null, response);
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
