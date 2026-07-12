function [sequences, categorical_labels] = createLSTMDataSet(path)

    s = strcat(path, '*.pcap'); %to reach mat file from provided path
    data = dir(s);
%     files = shuffle(data, 500);
    seqData = cell(length(data), 1); % initialize the data array
    
     labels = strings(length(data), 1); % initialize the labels array
    tempClassMatrix= strings(1,1);
     maxForScale = 0;
     minForScale = 99999;
    for i = 1:length(data)  %every files are iterated and their labels are extracted
        dataFilename=data(i).name; %extract filename of the each data file
    filepath = strcat(path,'/',dataFilename); %create path for each data file using filename
    [filename,name,ext] = fileparts(filepath); %extract filename and other information from its path for each data file
    
    %reading each activity data from its filepath using read_bf_file that
    %is provided by used CSI Tool software
    [timeStamp, denoisedMag] = fileReader(filepath);
        
        
        fName = data(i).name; % the name of the data file
        
        % add this trial to the data array
        s = strcat(path, fName);
%         loaded = load(s);
% %         if size(loaded.output,2) == 10
%          nullSub = [1 2 3 4 5 6 128 129 130 252 253 254 255 256];
%         pilotSub = [26 54 90 118 140 168 204 232];
%         removeSub = [nullSub pilotSub];
%         y1 = transpose(loaded.output_matrix(:,1:10));
        [filepath,filename,ext] = fileparts(s);
        label = regexprep(filename,'[\d"]',''); %label is extracted from the filename
        labels(i,1) = label;
%         
%         if strcmp(label,'standup')
%             y1 = flip(y1);            
%         end
        %wooutliers = (rmoutliers(transpose(y1)));
        %denoised = denoise(wooutliers);
%         [principalComponents, time] = PrincipalComponents(transpose(denoisedMag), timeStamp);
        seqData{i, 1} = normalize(transpose((denoisedMag)));
%         if maxForScale < max(seqData{i, 1}, [], 'all');
%            maxForScale = max(seqData{i, 1}, [], 'all');
%         end
%         if minForScale < min(seqData{i, 1}, [], 'all')
%            minForScale = min(seqData{i, 1}, [], 'all');
%         end
        
        %transpose(normalize(transpose(y1)));
%         plot(wooutliers)
%         end  q
%          figure
%         for j = 1:size(y1,2)
%             plot(transpose(y1(:,j)))
%             hold on
%         end
        
%         labels = categorical()
        %files are named as shortly, to prevent misunderstanding 
        % depending on short version of the label, new labels are created
        if strcmp(label,'walk')
            tempClassMatrix(i,1) = 'walk';
            labels(i) = {tempClassMatrix(:,:)};    
        elseif strcmp(label,'sit')
            tempClassMatrix(i,1) = 'sit';
            labels(i) = {tempClassMatrix(:,:)};
        elseif strcmp(label,'standup')
            tempClassMatrix(i,1) = 'standup';
            labels(i) = {tempClassMatrix(:,:)};
%         elseif strcmp(label,'lie')
%             labels(i,1) = 'lie';
        elseif strcmp(label,'fall')
            tempClassMatrix(i,1) = 'fall';
        elseif strcmp(label,'sitdown')
            tempClassMatrix(i,1) = 'sitdown';
            labels(i) = {tempClassMatrix(:,:)}
        elseif strcmp(label,'stand')
            tempClassMatrix(i,1) = 'stand';
        end
    end
    [sequences, labels] = shuffle(seqData, tempClassMatrix, 0);
%     
%     for i = 1:length(data)
%         sequencesres{i,1} = (-maxForScale*(-100) + minForScale*100 + (-100 - 100)*seqData{i,1})/(minForScale - maxForScale);
%     end
     sequences=seqData;
    %     categorical_labels = mat2cell(labels,size(labels,1)); % transform the labels array into a categorical labels, LSTM accepts the labels in this format
categorical_labels = tempClassMatrix;
% sequences = seqData;
end