import java.util.HashSet;
import java.util.Random;

public class RandomExample {

	public static void main(String[] args) {
		Random rand = new Random();
		int e;
		int i;
		int g = 50;
		HashSet<Integer> randomNumbers = new HashSet<Integer>();

		for (i = 0; i < g; i++) {
			e = rand.nextInt(50);
			randomNumbers.add(e);
			if (randomNumbers.size() <= 50) {
				if (randomNumbers.size() == 50) {
					g = 50;
				}
				g++;
				randomNumbers.add(e);
			}
		}
		System.out.println("Ten Unique random numbers from 1 to 50 are  : " + randomNumbers);
	}
}