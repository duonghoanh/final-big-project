import numpy as np
import pandas as pd
from sklearn.cluster import KMeans


def mf(array, lf, steps, alpha, beta):
    num_users, num_items = array.shape
    X = np.random.normal(scale=1./lf, size=(num_users, lf))
    W = np.random.normal(scale=1./lf, size=(num_items, lf))

    b_u = np.zeros(num_users)
    b_i = np.zeros(num_items)
    b = np.mean(array[np.where(array != 0)])

    samples = [
        (i, j, array[i, j])
        for i in range(num_users)
        for j in range(num_items)
        if array[i, j] > 0
    ]
    for i in range(steps):

        np.random.shuffle(samples)

        for m, n, o in samples:
            prediction = b + b_u[m] + b_i[n] + X[m, :].dot(W[n, :].T)
            e = (o - prediction)

            b_u[m] += alpha * (e - beta * b_u[m])
            b_i[n] += alpha * (e - beta * b_i[n])

            X[m, :] += alpha * (e * W[n, :] - beta * X[m, :])
            W[n, :] += alpha * (e * X[m, :] - beta * W[n, :])

        xs, ys = array.nonzero()

        predicted = b + b_u[:, np.newaxis] + \
            b_i[np.newaxis, :] + X.dot(W.T)

        error = 0
        for x, y in zip(xs, ys):
            error += pow(array[x, y] - predicted[x, y], 2)

        mse = np.sqrt(error)

        if(i+1) % 10 == 0:
            print('Iteration: %d ; error = %.4f' % (i+1, mse))

    return [X, W, b_u, b_i, b]


df = pd.read_csv(
    'D:/ALL_PROJECT/MERN/PBL6_TMDT/recomendation/small_data.csv', index_col=0)
data_input = df.tail(df.shape[0]-2).to_numpy()
input = data_input.astype(int)

mf = mf(input, 30, 1000, 0.01, 0.01)
X, W, b_u, b_i, b = mf


for row in range(df.shape[0]):
    for col in range(df.shape[1]):
        try:
            if int(df.iloc[row][col]) == 0:
                df.iloc[row][col] = b + b_u[row-2] + \
                    b_i[col] + X[row-2, :].dot(W[col, :].T)
        except:
            continue

df.to_csv('D:/ALL_PROJECT/MERN/PBL6_TMDT/recomendation/result.csv')

data = pd.read_csv('D:/ALL_PROJECT/MERN/PBL6_TMDT/recomendation/small_data.csv', index_col=0)
result = pd.read_csv('D:/ALL_PROJECT/MERN/PBL6_TMDT/recomendation/result.csv', index_col=0)

X = result.tail(result.shape[0]-2).transpose().to_numpy()
kmeans = KMeans(n_clusters=3, random_state=0).fit(X)
pred_label = kmeans.predict(X)
result.loc['label'] = pred_label
result.to_csv('D:/ALL_PROJECT/MERN/PBL6_TMDT/recomendation/recommendations.csv')


list = []
for row in range(data.shape[0]):

    score = []
    for col in range(data.shape[1]):
        try:
            if int(data.iloc[row][col]) == 0:
                score.append((col, result.iloc[row][col]))
        except:
            continue

    temp = pd.DataFrame(score, columns=['location', 'score'])
    temp.sort_values(by=['score'], inplace=True, ascending=False)

    names = []

    for i in range(temp.head(10).shape[0]):
        id = result.iloc[1][temp.iloc[i][0]]
        brand = result.iloc[0][temp.iloc[i][0]]
        name = brand + ' ' + id
        names.append(name)

    if len(temp) > 0:
        recommendation = {'user': [], 'name': []}
        recommendation['user'].append(result.iloc[row].name)
        recommendation['name'].append(names)
        list.append(recommendation)

list_recommendation = pd.DataFrame(list, columns=['user', 'name'])
list_recommendation.to_csv('D:/ALL_PROJECT/MERN/PBL6_TMDT/recomendation/recommendations.csv', index=False)

for i in range(4):
    print("hi",i)