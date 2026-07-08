import NetworkClient from "./network/NetworClient";
import ReadInputs from "./input/ReadInputs";

class Game{
  private network: NetworkClient;
  private input: ReadInputs;

  constructor() {
    this.network = new NetworkClient;
    this.input = new ReadInputs
  }

  public startGame(){
    this.network.connect
  }
}