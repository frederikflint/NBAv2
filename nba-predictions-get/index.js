import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-1" });

async function getStandings() {
  const rawData = await client.send(
    new ScanCommand({
      TableName: "nba-predictions",
    })
  );

  if (rawData.Items.length) {
    const data = rawData.Items.map((item) => unmarshall(item));

    return data;
  }

  return [];
}

export const handler = async (event, context, callback) => {
  try {
    const data = await getStandings();

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
