function [data, features] = readTrainingData()
    trainingDataMatrix = zeros(1,256);
    trainingFeaturesDataMatrix = zeros(1,256);
    i = 1;
    
    filename = './data/octoberstay.pcap';
    [pc,ft, time] = TrainingData(filename);
    trainingDataMatrix(:,i)= pc;
    trainingFeaturesDataMatrix(i,:) = ft;
    i = i + 1;
    
    filename = './data/octoberstay2.pcap';
    [pc,ft] = TrainingData(filename);
    trainingDataMatrix(:,i)= pc;
    trainingFeaturesDataMatrix(i,:) = ft;
    i = i + 1;
    
    
    filename = './data/octoberstay3.pcap';
    [pc,ft] = TrainingData(filename);
    trainingDataMatrix(i,:)= pc;
    trainingFeaturesDataMatrix(i,:) = ft;
    i = i + 1;
    
    
    filename = './data/octoberstay4.pcap';
    [pc,ft] = TrainingData(filename);
    trainingDataMatrix(i,:)= pc;
    trainingFeaturesDataMatrix(i,:) = ft;
    i = i + 1;
    
    
    filename = './data/octoberstay5.pcap';
    [pc,ft] = TrainingData(filename);
    trainingDataMatrix(i,:)= pc;
    trainingFeaturesDataMatrix(i,:) = ft;
    i = i + 1;
    data = trainingDataMatrix;
    features = trainingFeaturesDataMatrix;
end