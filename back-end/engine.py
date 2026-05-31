from stockfish import Stockfish
import random

class Engine:

    def __init__(self):
        self.stockfish = Stockfish('./stockfish/stockfish_14_x64')

    def get_stockfish_best_move(self, board):
        self.stockfish.set_fen_position(board.fen())
        return self.stockfish.get_best_move()

    def get_random_move(self, board):
        legal_moves = [str(move) for move in board.legal_moves]
        return random.choice(legal_moves)