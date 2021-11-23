from os import system
from time import sleep, time
# from datetime import datetime

counter = 0
timestart = time()
while True:
    loopstart = time()
    counter += 1
    system('yarn updateHealthFactors')
    # dt = datetime.now()
    print(f"\n loop count: {counter}  |||  time running: {time() - timestart} |||  loop time: {time() - loopstart} ")
    # print('done')
    sleep(60)