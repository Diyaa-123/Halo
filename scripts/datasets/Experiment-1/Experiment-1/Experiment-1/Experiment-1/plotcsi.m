function [output] = plotcsi( csi, nfft, normalize )
%PLOTCSI Summary of this function goes here
%   Detailed explanation goes here
csi_buff = fftshift(csi,2);
csi_phase = rad2deg(angle(csi_buff));
output = [];

for cs = 1:size(csi_buff,1)
    csi = abs(csi_buff(cs,:));
    if normalize
        csi = csi./max(1000);
    end
    csi_buff(cs,:) = csi;
end

% figure
 x = -(nfft/2):1:(nfft/2-1);  % orignal file

% x = -(nfft/2-1):1:(nfft/2);

% subplot(3,1,3)
% imagesc(x,[1 size(csi_buff,1)],csi_buff)
% myAxis = axis();
% axis([min(x)-0.1, max(x)+0.1, myAxis(3), myAxis(4)])
% set(gca,'Ydir','reverse')
% xlabel('Subcarrier')
% ylabel('Packet number')

max_y = max(csi_buff(:));
for cs = 1:size(csi_buff,1)
        adj = 3;    % window size
        nsig =0.75; %standard deviations as the criteria for identifying outliers.
        csihamp = hampel(csi_buff(cs,:),adj,nsig); % d = hampel(x,k,nsigma) hampel(csi,adj,nsig) specifies a number of standard deviations, nsigma, by which a sample of x must differ from the local median for it to be replaced with the median. nsigma defaults to 3.
        csiden = wdenoise(csihamp,5,'Wavelet','sym6'); % Wavelet signal denoising -- wdenoise matlab wedenoise with level 5 and wavelet we use sym6.
        csi = csiden;
        %       
        meandevcsi = mad(csi,0,'all'); 
      
       % csi = csi_buff(cs,:); % orignal
%         subplot(3,1,1)
%         hold on
%         plot(x,csi);  %% Orignal 
%         grid on
%         myAxis = axis();
% %       axis([min(x)-0.5, max(x)+0.5, 0, max_y]) % orignal
%         axis([min(x)-0.5, max(x)+0.5, 0, 3000])
    
%         xlabel('Subcarrier')
%         ylabel('Magnitude')
%         title('Channel State Information')    
%         text(max(x),max_y-(0.05*max_y),['Packet #',num2str(cs),' of ',num2str(size(csi_buff,1))],'HorizontalAlignment','right','Color',[0.75 0.75 0.75]);
%         hold off
    
    
     % ###########################################   
%         subplot(3,1,2)
%         plot(x,csi_phase(cs,:));
%         grid on
%         myAxis = axis();
%         axis([min(x)-0.5, max(x)+0.5, -180, 180])
%         xlabel('Subcarrier')
%         ylabel('Phase')  
        
        
        output = [output; csi];
        end
fclose('all');
end