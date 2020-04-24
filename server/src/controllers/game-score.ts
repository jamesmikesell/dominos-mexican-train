import { Scores, Hand, Player } from '../../../common/src/model/game-table';

export class GameScorer {

  static score(gameScores: Map<number, Scores[]>, gameId: number, hands: Hand[], players: Map<string, Player>): string[] {
    let roundScores: Scores[] = [];
    let playersInRound = new Set<string>();
    hands.forEach(hand => {
      let score = 0
      Array.from(hand.dominos)
        .forEach(domino => {
          score = domino.left + domino.right + score;
        });

      playersInRound.add(hand.playerId);
      roundScores.push(new Scores(hand.playerId, score));
    })

    gameScores.set(gameId, roundScores);
    roundScores.sort((a, b) => b.score - a.score);

    let playerCombinedScores = new Map<string, number>();
    gameScores.forEach(singleGameScores => {
      singleGameScores.forEach(singleScore => {
        let combinedScore = playerCombinedScores.get(singleScore.playerId);
        if (combinedScore == null)
          combinedScore = 0;
        combinedScore += singleScore.score;
        playerCombinedScores.set(singleScore.playerId, combinedScore);
      });
    });
    let uniqueTotalScores = new Set<number>();
    playerCombinedScores.forEach((playersScore, playerId) => {
      if (playersInRound.has(playerId))
        uniqueTotalScores.add(playersScore)
    });
    let scorePosition = Array.from(uniqueTotalScores).sort((a, b) => a - b);

    let scoreMessage: string[] = [];
    roundScores.forEach(score => {
      let combinedScore = playerCombinedScores.get(score.playerId);
      scoreMessage.push(`${players.get(score.playerId).name} - ${score.score}. Combined ${combinedScore}. Overall Ranking ${scorePosition.indexOf(combinedScore) + 1}`);
    });

    return scoreMessage;
  }

}
