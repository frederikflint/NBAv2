import json
import requests
import boto3
from bs4 import BeautifulSoup
from datetime import datetime


def extract_team_statistics(soup, team, conference_index):
    try:
        result = soup.find("a", class_="AnchorLink", string=team)
        index = result.parent.parent.parent.parent["data-idx"]

        # Find win / loss for team in east
        select_statement = "tr[data-idx='" + index + "']"
        team_data_row = soup.select(select_statement)[conference_index]
        team_data_wins = team_data_row.contents[0].getText()
        team_data_losses = team_data_row.contents[1].getText()

        return {
            "placement": int(index) + 1,
            "wins": int(team_data_wins),
            "losses": int(team_data_losses),
        }
    except Exception as err:
        print("Something went wrong getting statistics for", team)
        print("Error: ", err)

        return {}


def update_standings():
    URL = "https://www.espn.com/nba/standings/_/season/2023"
    headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.142 Safari/537.36"
    }

    eastern_teams = [
        "Milwaukee Bucks",
        "Boston Celtics",
        "Philadelphia 76ers",
        "Cleveland Cavaliers",
        "New York Knicks",
        "Brooklyn Nets",
        "Atlanta Hawks",
        "Miami Heat",
        "Chicago Bulls",
        "Toronto Raptors",
        "Indiana Pacers",
        "Washington Wizards",
        "Orlando Magic",
        "Charlotte Hornets",
        "Detroit Pistons",
    ]

    western_teams = [
        "Denver Nuggets",
        "Memphis Grizzlies",
        "Sacramento Kings",
        "Phoenix Suns",
        "LA Clippers",
        "Golden State Warriors",
        "Los Angeles Lakers",
        "Minnesota Timberwolves",
        "Oklahoma City Thunder",
        "New Orleans Pelicans",
        "Dallas Mavericks",
        "Utah Jazz",
        "Portland Trail Blazers",
        "Houston Rockets",
        "San Antonio Spurs",
    ]
    page = requests.get(URL, headers=headers)

    if not page.ok:
        print("Couldn't successfully request page. Executing...")
        exit()

    print("Successfully requested page")

    soup = BeautifulSoup(page.content, "html.parser")

    eastern_standings = {}
    western_standings = {}

    try:
        for team in eastern_teams:
            eastern_standings[team] = extract_team_statistics(soup, team, 1)
        print("Successfully parsed eastern teams")
    except Exception as err:
        print("Something went wrong parsing eastern teams. Error:", err)

    try:
        for team in western_teams:
            western_standings[team] = extract_team_statistics(soup, team, 3)
        print("Successfully parsed western teams")
    except Exception as err:
        print("Something went wrong parsing western teams. Error:", err)

    now = datetime.utcnow()

    date = now.strftime("%d/%m/%Y")
    time = now.strftime("%H:%M:%S")

    db_entity = {
        "date": date,
        "time": time,
        "eastern": eastern_standings,
        "western": western_standings,
    }

    print("Inserting... ", db_entity)

    dynamodb = boto3.resource("dynamodb", region_name="eu-west-1")
    table = dynamodb.Table("nba-standings")

    response = table.put_item(Item=db_entity)

    print(f"PutItem succeeded: {response}")


def lambda_handler(event, context):
    update_standings()

    return {"statusCode": 200, "body": json.dumps("Hello from Lambda!")}
