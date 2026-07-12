function analyze(timestampms)
tsSize = max(size(timestampms));
difference = zeros(tsSize,1);
   for i = 2:tsSize
       difference(i) = timestampms(1,i)-timestampms(1,i-1);
   end  
   
   figure
   plot(1:tsSize, difference(1:tsSize), 'Marker','o','MarkerFaceColor','red');
   %histogram(difference,tsSize);
   ms =zeros(1,4);
   for j = 1:tsSize
       if(difference(j)<=10)
        ms(1,1) = ms(1,1) + 1;
       end
       if((difference(j)>1) && (difference(j)<=100))
        ms(1,2) = ms(1,2) + 1;
       end
       
       if((difference(j)>10) && (difference(j)<=25))
        ms(1,3) = ms(1,3) + 1;
       end
       
       if(difference(j)>25)
        ms(1,4) = ms(1,4) + 1;
       end
       
   end
    figure
    histogram(difference, 4);

end