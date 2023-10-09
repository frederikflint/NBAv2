import { useEffect, useState } from "react";
import "./App.css";

export interface Prediction {
  username: string;
  datetime: string;
  eastern: EastPrediction;
  western: WestPrediction;
}

export interface EastPrediction {
  "Milwaukee Bucks": number;
  "Boston Celtics": number;
  "Philadelphia 76ers": number;
  "Cleveland Cavaliers": number;
  "New York Knicks": number;
  "Brooklyn Nets": number;
  "Atlanta Hawks": number;
  "Miami Heat": number;
  "Chicago Bulls": number;
  "Toronto Raptors": number;
  "Indiana Pacers": number;
  "Washington Wizards": number;
  "Orlando Magic": number;
  "Charlotte Hornets": number;
  "Detroit Pistons": number;
}

export interface WestPrediction {
  [team: string]: number;
}

function App() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [standings, setStandings] = useState(null);
  useEffect(() => {
    fetch(
      "https://lg8xwt1mnk.execute-api.eu-west-1.amazonaws.com/default/nba-predictions-get"
    )
      .then((res) => res.json())
      .then((res) => {
        setPredictions(res);
      });
  }, []);

  useEffect(() => {
    fetch(
      "https://9781ggjbg5.execute-api.eu-west-1.amazonaws.com/default/nba-standings-get"
    )
      .then((res) => res.json())
      .then((res) => {
        setStandings(res);
      });
  }, []);

  const renderPredictions = () => {
    console.log(predictions);

    return predictions.map((prediction) => {
      console.log(prediction);
      return (
        <>
          <div>
            {Object.keys(prediction.eastern).map((team: string) => {
              return <div key={prediction.username + team}>{team}</div>;
            })}
          </div>
          <div>
            {Object.keys(prediction.western).map((team: string) => {
              return <div key={prediction.username + team}>{team}</div>;
            })}
          </div>
        </>
      );
    });
  };

  return (
    <div className="container bg-gray-800">
      <div className="flex">Hej</div>
    </div>
  );
}

export default App;
