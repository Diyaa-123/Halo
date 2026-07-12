Output_Data_Folder = "./data/realdata/input_data/30ms/csidata/"; % folder path to extract output data as .mat file
s=strcat(Output_Data_Folder,'*.pcap'); %Access input data folder and bring .dat files
trainDataPath = './data/realdata/output_data/allsubs/30ms/rawdata/';
    files = dir(s);
    sequences = cell(length(files), 1); % initialize the data array
    
     labels = strings(length(files), 1); % initialize the labels array
    tempClassMatrix= strings(1,1);

    
    for i = 805:length(files)  %every files are iterated and their labels are extracted
        
        fName = files(i).name; % the name of the data file
        filepath = strcat(Output_Data_Folder,'/',fName); %create path for each data file using filename
        [filename,name,ext] = fileparts(filepath); %extract filename and other information from its path for each data file
    
    %reading each activity data from its filepath using read_bf_file that
    %is provided by used CSI Tool software
    [timeStamp, denoisedMag] = fileReader(filepath);
%     magxtime = [(denoisedMag) transpose(timeStamp)];
%      y = rmoutliers(magxtime);
     
%      figure  
%      plot(denoisedMag)
%     
%      
%      figure  
%      plot(denoise(denoisedMag(:,1:100)))
% p =0;
     [principalComponents, time] = PrincipalComponents(transpose(denoisedMag), timeStamp);

     subplot(3,1,1)
     plot((denoisedMag))
     ylabel('Amplitude')
     xlabel('Number of packets')
     title('Fall')
     
     subplot(3,1,2)
     plot(denoisedMag)
     ylabel('Amplitude')
     xlabel('Number of packets')
     title('Sit-down')
     
     subplot(3,1,3)
     plot(denoisedMag)
     ylabel('Amplitude')
     xlabel('Number of packets')
     title('Stand-up')
     

%      subplot(2,1,1)
% plot((denoisedMag))
% ylabel('Amplitude')
% xlabel('Number of packets')
% title('Raw CSI Amplitude')
% subplot(2,1,2)
% plot(principalComponents(:,1:3))
% ylabel('Amplitude')
% xlabel('Number of packets')
% title('3 Principal Components')
%      for k = 2 : size(timeStamp,2)
%         if(timeStamp(1,k)-timeStamp(1,k-1)<20)
%             continue
%         end
%         p = p+1;
%         removed(p,:) = principalComponents(k,:);
%      end
     
     
     
%             figure 
%             plot(removed(:,1:10))
%             
%             
    output_matrix = denoisedMag;
    outFile=strcat(trainDataPath,name,'.mat'); %output file path is created with respect to previous filename of data.

    %save(outFile,'output_matrix');  % save denoised amplitude data into created output file

%   L = size(principalComponents,1);          
%             Y = fft(principalComponents,L);
%     magxtime = [(denoisedMag) transpose(timeStamp)];
%      y = rmoutliers(magxtime);


% Pyy = Y.*conj(Y)/L;
% tmp = size((1:L/2+1),2);
% f = 1000/L*(1:L/2 +1);
% figure
% plot(f,Pyy(1:tmp,1))
% title('Power spectral density')
% xlabel('Frequency (Hz)')
%    
    end