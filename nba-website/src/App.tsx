import { Fragment, useEffect, useState } from "react";
import "./App.css";

const eastTeamShortNames: { [key: string]: string } = {
  "Milwaukee Bucks": "MIL",
  "Boston Celtics": "BOS",
  "Philadelphia 76ers": "PHI",
  "Cleveland Cavaliers": "CLE",
  "New York Knicks": "NYK",
  "Brooklyn Nets": "BKN",
  "Atlanta Hawks": "ATL",
  "Miami Heat": "MIA",
  "Chicago Bulls": "CHI",
  "Toronto Raptors": "TOR",
  "Indiana Pacers": "IND",
  "Washington Wizards": "WAS",
  "Orlando Magic": "ORL",
  "Charlotte Hornets": "CHA",
  "Detroit Pistons": "DET",
};

const westTeamShortNames: { [key: string]: string } = {
  "Denver Nuggets": "DEN",
  "Memphis Grizzlies": "MEM",
  "Sacramento Kings": "SAC",
  "Phoenix Suns": "PHX",
  "LA Clippers": "LAC",
  "Golden State Warriors": "GSW",
  "Los Angeles Lakers": "LAL",
  "Minnesota Timberwolves": "MIN",
  "Oklahoma City Thunder": "OKC",
  "New Orleans Pelicans": "NOP",
  "Dallas Mavericks": "DAL",
  "Utah Jazz": "UTA",
  "Portland Trail Blazers": "POR",
  "Houston Rockets": "HOU",
  "San Antonio Spurs": "SAS",
};

export interface Prediction {
  username: string;
  datetime: string;
  eastern: ConferncePrediction;
  western: ConferncePrediction;
}

export interface Standings {
  date: string;
  western: TeamStatisticsDictionary;
  eastern: TeamStatisticsDictionary;
}

export interface TeamStatisticsDictionary {
  [team: string]: TeamStatistics;
}

export interface TeamStatistics {
  wins: number;
  losses: number;
  placement: number;
}

export interface ConferncePrediction {
  [team: string]: number;
}

function App() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [standings, setStandings] = useState<Standings | undefined>(undefined);
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

  const calculateOffsetTeam = (
    confName: string,
    teamName: string,
    pred: number
  ) => {
    if (!standings) {
      return 0;
    }

    const conf = confName === "East" ? standings.eastern : standings.western;

    const offSet = Math.abs(conf[teamName].placement - pred);

    if (!offSet) {
      return 0;
    } else {
      return <span>+ {offSet}</span>;
    }
  };

  const calculatOffsetConf = (
    confName: string,
    prediction: ConferncePrediction
  ) => {
    if (!standings) {
      return 0;
    }

    const conference =
      confName === "East" ? standings.eastern : standings.western;

    let result = 0;
    Object.keys(prediction).forEach((team) => {
      const teamPredicted = prediction[team];
      const teamActual = conference[team].placement;

      result += Math.abs(teamPredicted - teamActual);
    });

    return result;
  };

  const renderConferencePrediction = (
    prediction: ConferncePrediction,
    confName: string
  ) => {
    const confOffset = calculatOffsetConf(confName, prediction);

    return (
      <div id="east" className="grid grid-cols-8">
        <span className="font-bold col-span-8">{confName}</span>
        {Object.keys(prediction)
          .sort((a, b) => prediction[a] - prediction[b])
          .map((team) => {
            const pred = prediction[team];

            return (
              <Fragment key={team + "pred"}>
                <div className="text-center">{pred}.</div>
                <div className="sm:hidden col-span-5">
                  {confName === "East"
                    ? eastTeamShortNames[team]
                    : westTeamShortNames[team]}
                </div>
                <div className="hidden sm:block col-span-6">{team}</div>
                <div className="col-span-2 sm:col-span-1 text-right">
                  {calculateOffsetTeam(confName, team, pred)}
                </div>
              </Fragment>
            );
          })}

        <div className="font-bold col-span-8 text-right">
          {confOffset ? "+ " + confOffset : "0"}
        </div>
      </div>
    );
  };

  const calculatOffsetUser = (userPrediction: Prediction) => {
    const eastOffset = calculatOffsetConf("East", userPrediction.eastern);
    const westOffset = calculatOffsetConf("West", userPrediction.western);

    return eastOffset + westOffset;
  };

  const renderUserPrediction = (prediction: Prediction) => {
    return (
      <div key={prediction.username} className="col-span-2 lg:col-span-1">
        <div id="header" className="font-bold">
          {prediction.username}
        </div>
        <div className="grid grid-cols-2 gap-2 border border-black rounded-md bg-blue-100 p-4">
          {renderConferencePrediction(prediction.eastern, "East")}
          {renderConferencePrediction(prediction.western, "West")}
          <div className="font-bold">
            Score: {calculatOffsetUser(prediction)}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    return (
      <>
        <div className="bg-blue-100 rounded-md font-bold lg:text-left p-2">
          User predictions
        </div>

        <div className="grid grid-cols-2 gap-4 lg:text-left mt-2">
          {predictions
            .sort((a, b) => calculatOffsetUser(a) - calculatOffsetUser(b))
            .map((prediction) => {
              return renderUserPrediction(prediction);
            })}
        </div>
      </>
    );
  };

  const renderConferenceStandings = (
    conferenceObj: TeamStatisticsDictionary,
    confName: string
  ) => {
    return (
      <div className="col-span-2 lg:col-span-1">
        <div id="header" className="font-bold">
          {confName}
        </div>
        <div className="grid grid-cols-7 border border-black rounded-md bg-blue-200 p-4">
          <span className="font-bold">Rank</span>
          <span className="col-span-4 font-bold">Team</span>
          <span className="font-bold">Wins</span>
          <span className="font-bold">Losses</span>
          {Object.keys(conferenceObj)
            .sort(
              (a, b) => conferenceObj[a].placement - conferenceObj[b].placement
            )
            .map((team) => {
              const stats = conferenceObj[team];
              return (
                <Fragment key={team + "standings"}>
                  <span>{stats.placement}</span>
                  <span className="col-span-4">{team}</span>
                  <span>{stats.wins}</span>
                  <span>{stats.losses}</span>
                </Fragment>
              );
            })}
        </div>
      </div>
    );
  };

  const renderStandings = () => {
    if (!standings) return;

    return (
      <>
        <div className="bg-blue-200 rounded-md font-bold lg:text-left p-2">
          Current live standings
        </div>
        <div className="grid grid-cols-2 gap-4 lg:text-left mt-2">
          {renderConferenceStandings(standings.eastern, "East")}
          {renderConferenceStandings(standings.western, "West")}
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto">
      <div className="flex-col space-y-4">
        <div
          id="header"
          className="w-full bg-blue-300 lg:text-left p-2 rounded-md font-bold"
        >
          NBA Predictions 2023 / 2024
        </div>
        <div id="current-nba-standings" className="w-full pt-2 rounded-md">
          {renderStandings()}
        </div>
        <div id="user-redictions" className="w-full pt-2 rounded-md">
          {renderPredictions()}
        </div>
      </div>
    </div>
  );
}

export default App;
